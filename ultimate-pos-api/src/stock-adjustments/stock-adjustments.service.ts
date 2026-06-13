import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/update-stock-adjustment.dto';
import { StockService } from '../inventory/stock.service';
import { PostingService } from '../accounting/posting.service';

@Injectable()
export class StockAdjustmentsService {
  constructor(
    private prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly postingService: PostingService,
  ) {}

  async findAll(businessId: number, locationId?: number) {
    return this.prisma.stockAdjustment.findMany({
      where: {
        businessId,
        ...(locationId ? { locationId } : {}),
      },
      include: {
        location: { select: { id: true, name: true } },
        lines: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, businessId: number) {
    const adj = await this.prisma.stockAdjustment.findFirst({
      where: { id, businessId },
      include: {
        location: { select: { id: true, name: true } },
        lines: {
          include: {
            variation: { select: { id: true, name: true, subSku: true } },
          },
        },
      },
    });
    if (!adj) throw new NotFoundException(`Stock adjustment #${id} not found`);
    return adj;
  }

  async create(businessId: number, userId: number, dto: CreateStockAdjustmentDto) {
    const { lines, ...rest } = dto;

    const result = await this.prisma.$transaction(async (tx) => {
      const isFinalised = (rest.status ?? 'received') === 'received';
      const adjustment = await tx.stockAdjustment.create({
        data: {
          businessId,
          createdBy: userId,
          locationId: rest.locationId ?? null,
          referenceNo: rest.referenceNo ?? null,
          adjustmentType: rest.adjustmentType ?? 'normal',
          note: rest.note ?? null,
          status: rest.status ?? 'received',
          finalised: isFinalised,
          finalisedAt: isFinalised ? new Date() : null,
        },
      });

      if (lines && lines.length > 0) {
        const processedLines = [];
        for (const l of lines) {
          let finalQty = l.quantity ?? 0;
          let systemQtyVal: number | null = null;

          if (l.actualQty !== undefined && l.actualQty !== null) {
            if (!l.variationId || !rest.locationId) {
              throw new BadRequestException(
                'locationId and variationId are required for physical inventory count adjustments',
              );
            }
            const detail = await tx.variationLocationDetails.findFirst({
              where: { variationId: l.variationId, locationId: rest.locationId },
            });
            const sQty = detail ? Number(detail.qtyAvailable) : 0;
            systemQtyVal = sQty;
            finalQty = l.actualQty - sQty;
          } else if (l.reason === 'found') {
            finalQty = Math.abs(l.quantity ?? 0);
          } else if (['damage', 'expiry', 'missing'].includes(l.reason ?? '')) {
            finalQty = -Math.abs(l.quantity ?? 0);
          } else {
            // Default decrement behavior to match old logic
            finalQty = -Math.abs(l.quantity ?? 0);
          }

          processedLines.push({
            adjustmentId: adjustment.id,
            variationId: l.variationId ?? null,
            quantity: finalQty,
            unitPrice: l.unitPrice ?? 0,
            reason: l.reason ?? null,
            actualQty: l.actualQty ?? null,
            systemQty: systemQtyVal,
          });
        }

        await tx.stockAdjustmentLine.createMany({
          data: processedLines,
        });

        const totalAmount = processedLines.reduce(
          (sum, pl) => sum + Math.abs(Number(pl.quantity)) * (pl.unitPrice ?? 0),
          0,
        );

        await tx.stockAdjustment.update({
          where: { id: adjustment.id },
          data: { totalAmount },
        });

        // Update Stock Levels only if finalised
        if (isFinalised && rest.locationId) {
          for (const pl of processedLines) {
            if (pl.variationId) {
              await this.stockService.updateStockLevel(
                pl.variationId,
                rest.locationId,
                pl.quantity,
                'adjustment',
                rest.referenceNo ?? `ADJ-${adjustment.id}`,
                rest.note ?? undefined,
                tx,
              );

              // Log lot deductions in quantityAdjusted on purchase lines
              const isExpiryOrDamage =
                rest.adjustmentType === 'expired' ||
                rest.adjustmentType === 'damage' ||
                pl.reason === 'expiry' ||
                pl.reason === 'damage';

              if (isExpiryOrDamage && pl.quantity < 0) {
                let qtyToAdjust = Math.abs(Number(pl.quantity));
                const purchaseLines = await tx.purchaseLine.findMany({
                  where: {
                    variationId: pl.variationId,
                    purchase: {
                      businessId,
                      status: 'received',
                    },
                  },
                  orderBy: {
                    purchase: {
                      purchaseDate: 'asc',
                    },
                  },
                });

                for (const purchaseLine of purchaseLines) {
                  const remaining =
                    Number(purchaseLine.quantity) -
                    Number(purchaseLine.quantitySold) -
                    Number(purchaseLine.quantityAdjusted);
                  if (remaining <= 0) continue;

                  const alloc = Math.min(remaining, qtyToAdjust);
                  qtyToAdjust -= alloc;

                  await tx.purchaseLine.update({
                    where: { id: purchaseLine.id },
                    data: {
                      quantityAdjusted: Number(purchaseLine.quantityAdjusted) + alloc,
                    },
                  });

                  if (qtyToAdjust <= 0) break;
                }
              }
            }
          }
        }
      }

      return tx.stockAdjustment.findFirst({
        where: { id: adjustment.id, businessId },
        include: {
          location: { select: { id: true, name: true } },
          lines: {
            include: {
              variation: { select: { id: true, name: true, subSku: true } },
            },
          },
        },
      });
    });

    if (result && result.status === 'received') {
      await this.postingService.postStockAdjustmentToGL(businessId, result.id);
    }

    return result;
  }

  async confirmAdjustment(id: number, businessId: number) {
    const adj = await this.prisma.stockAdjustment.findFirst({
      where: { id, businessId },
      include: { lines: true },
    });
    if (!adj) throw new NotFoundException(`Stock adjustment #${id} not found`);
    if (adj.finalised) {
      throw new BadRequestException('Stock adjustment is already finalised');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedLines = [];
      for (const line of adj.lines) {
        let finalQty = Number(line.quantity);
        let currentSystemQty: number | null = null;

        if (line.actualQty !== null && line.actualQty !== undefined) {
          if (!line.variationId || !adj.locationId) {
            throw new BadRequestException(
              'locationId and variationId are required for physical inventory count adjustments',
            );
          }
          const detail = await tx.variationLocationDetails.findFirst({
            where: { variationId: line.variationId, locationId: adj.locationId },
          });
          currentSystemQty = detail ? Number(detail.qtyAvailable) : 0;
          finalQty = Number(line.actualQty) - currentSystemQty;

          // update systemQty and quantity (variance) on the database line
          await tx.stockAdjustmentLine.update({
            where: { id: line.id },
            data: {
              systemQty: currentSystemQty,
              quantity: finalQty,
            },
          });
        }

        updatedLines.push({
          ...line,
          quantity: finalQty,
        });

        if (adj.locationId && line.variationId) {
          await this.stockService.updateStockLevel(
            line.variationId,
            adj.locationId,
            finalQty,
            'adjustment',
            adj.referenceNo ?? `ADJ-${adj.id}`,
            adj.note ?? undefined,
            tx,
          );

          // Log lot deductions in quantityAdjusted on purchase lines
          const isExpiryOrDamage =
            adj.adjustmentType === 'expired' ||
            adj.adjustmentType === 'damage' ||
            line.reason === 'expiry' ||
            line.reason === 'damage';

          if (isExpiryOrDamage && finalQty < 0) {
            let qtyToAdjust = Math.abs(finalQty);
            const purchaseLines = await tx.purchaseLine.findMany({
              where: {
                variationId: line.variationId,
                purchase: {
                  businessId,
                  status: 'received',
                },
              },
              orderBy: {
                purchase: {
                  purchaseDate: 'asc',
                },
              },
            });

            for (const purchaseLine of purchaseLines) {
              const remaining =
                Number(purchaseLine.quantity) -
                Number(purchaseLine.quantitySold) -
                Number(purchaseLine.quantityAdjusted);
              if (remaining <= 0) continue;

              const alloc = Math.min(remaining, qtyToAdjust);
              qtyToAdjust -= alloc;

              await tx.purchaseLine.update({
                where: { id: purchaseLine.id },
                data: {
                  quantityAdjusted: Number(purchaseLine.quantityAdjusted) + alloc,
                },
              });

              if (qtyToAdjust <= 0) break;
            }
          }
        }
      }

      // Recalculate totalAmount since quantities might have changed
      const totalAmount = updatedLines.reduce(
        (sum, l) => sum + Math.abs(Number(l.quantity)) * Number(l.unitPrice),
        0,
      );

      await tx.stockAdjustment.update({
        where: { id },
        data: {
          status: 'received',
          finalised: true,
          finalisedAt: new Date(),
          totalAmount,
        },
      });

      return tx.stockAdjustment.findFirst({
        where: { id, businessId },
        include: {
          location: { select: { id: true, name: true } },
          lines: {
            include: {
              variation: { select: { id: true, name: true, subSku: true } },
            },
          },
        },
      });
    });

    if (result && result.status === 'received') {
      await this.postingService.postStockAdjustmentToGL(businessId, result.id);
    }

    return result;
  }

  async update(id: number, businessId: number, dto: UpdateStockAdjustmentDto) {
    await this.findOne(id, businessId);
    const rest = { ...dto };
    delete rest.lines;

    const result = await this.prisma.stockAdjustment.update({
      where: { id },
      data: {
        ...(rest.locationId !== undefined && { locationId: rest.locationId }),
        ...(rest.referenceNo !== undefined && { referenceNo: rest.referenceNo }),
        ...(rest.adjustmentType !== undefined && { adjustmentType: rest.adjustmentType }),
        ...(rest.note !== undefined && { note: rest.note }),
        ...(rest.status !== undefined && { status: rest.status }),
      },
    });

    if (result.status === 'received') {
      await this.postingService.postStockAdjustmentToGL(businessId, result.id);
    }

    return result;
  }

  async remove(id: number, businessId: number) {
    const adj = await this.findOne(id, businessId);

    return this.prisma.$transaction(async (tx) => {
      // Reverse stock levels only if it was finalised
      if (adj.finalised && adj.locationId && adj.lines && adj.lines.length > 0) {
        for (const line of adj.lines) {
          if (line.variationId) {
            await this.stockService.updateStockLevel(
              line.variationId,
              adj.locationId,
              -Number(line.quantity), // reverse: negate adjustment quantity
              'adjustment',
              adj.referenceNo ?? `ADJ-REV-${adj.id}`,
              'Stock adjustment deletion rollback',
              tx,
            );

            // Reverse lot deductions
            const isExpiryOrDamage =
              adj.adjustmentType === 'expired' ||
              adj.adjustmentType === 'damage' ||
              line.reason === 'expiry' ||
              line.reason === 'damage';

            if (isExpiryOrDamage && Number(line.quantity) < 0) {
              let qtyToRestore = Math.abs(Number(line.quantity));
              const purchaseLines = await tx.purchaseLine.findMany({
                where: {
                  variationId: line.variationId,
                  purchase: {
                    businessId,
                    status: 'received',
                  },
                },
                orderBy: {
                  purchase: {
                    purchaseDate: 'desc', // LIFO to restore latest adjustments first
                  },
                },
              });

              for (const purchaseLine of purchaseLines) {
                const adjusted = Number(purchaseLine.quantityAdjusted);
                if (adjusted <= 0) continue;

                const alloc = Math.min(adjusted, qtyToRestore);
                qtyToRestore -= alloc;

                await tx.purchaseLine.update({
                  where: { id: purchaseLine.id },
                  data: {
                    quantityAdjusted: adjusted - alloc,
                  },
                });

                if (qtyToRestore <= 0) break;
              }
            }
          }
        }
      }

      return tx.stockAdjustment.delete({ where: { id } });
    });
  }
}
