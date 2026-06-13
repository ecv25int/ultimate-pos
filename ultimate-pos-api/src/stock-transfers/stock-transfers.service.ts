import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { StockService } from '../inventory/stock.service';

@Injectable()
export class StockTransfersService {
  constructor(
    private prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  async create(businessId: number, userId: number, dto: CreateStockTransferDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Transfer must contain at least one item');
    }

    // Verify all products belong to the business
    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, businessId },
      });
      if (!product) throw new NotFoundException(`Product #${item.productId} not found`);
    }

    const refNo = dto.referenceNo ?? `TRF-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const createdTransfers = [];

      for (const item of dto.items) {
        const transfer = await tx.stockTransfer.create({
          data: {
            businessId,
            productId: item.productId,
            quantity: item.quantity,
            fromLocation: dto.fromLocation,
            toLocation: dto.toLocation,
            referenceNo: refNo,
            note: dto.note ?? null,
            status: dto.status ?? 'completed',
            createdBy: userId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        });

        createdTransfers.push(transfer);

        // If completed/received, create stock entries and update location stocks
        if (transfer.status === 'completed' || transfer.status === 'received') {
          await Promise.all([
            tx.stockEntry.create({
              data: {
                businessId,
                productId: item.productId,
                entryType: 'transfer_out',
                quantity: -Math.abs(Number(item.quantity)),
                referenceNo: refNo,
                note: `Transfer out to ${dto.toLocation}`,
                createdBy: userId,
              },
            }),
            tx.stockEntry.create({
              data: {
                businessId,
                productId: item.productId,
                entryType: 'transfer_in',
                quantity: Math.abs(Number(item.quantity)),
                referenceNo: refNo,
                note: `Transfer in from ${dto.fromLocation}`,
                createdBy: userId,
              },
            }),
          ]);

          const variation = await tx.variation.findFirst({
            where: { productId: item.productId },
            select: { id: true },
          });

          if (variation) {
            const fromLoc = await tx.businessLocation.findFirst({
              where: { name: dto.fromLocation, businessId },
              select: { id: true },
            });
            const toLoc = await tx.businessLocation.findFirst({
              where: { name: dto.toLocation, businessId },
              select: { id: true },
            });

            if (fromLoc) {
              await this.stockService.updateStockLevel(
                variation.id,
                fromLoc.id,
                -Math.abs(Number(item.quantity)),
                'transfer',
                refNo,
                `Transfer out to ${dto.toLocation}`,
                tx,
              );
            }
            if (toLoc) {
              await this.stockService.updateStockLevel(
                variation.id,
                toLoc.id,
                Math.abs(Number(item.quantity)),
                'transfer',
                refNo,
                `Transfer in from ${dto.fromLocation}`,
                tx,
              );
            }
          }
        }
      }

      return createdTransfers;
    });
  }

  async receiveTransfer(id: number, businessId: number, receivedQty?: number) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, businessId },
    });
    if (!transfer) throw new NotFoundException(`Stock transfer #${id} not found`);

    if (transfer.status !== 'pending') {
      throw new BadRequestException(`Stock transfer #${id} is not in pending status`);
    }

    const finalReceivedQty = receivedQty ?? Number(transfer.quantity);
    if (finalReceivedQty > Number(transfer.quantity)) {
      throw new BadRequestException('Cannot receive more than transferred');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockTransfer.update({
        where: { id },
        data: { status: 'received' },
        include: { product: { select: { id: true, name: true, sku: true } } },
      });

      await Promise.all([
        tx.stockEntry.create({
          data: {
            businessId,
            productId: transfer.productId,
            entryType: 'transfer_out',
            quantity: -Math.abs(Number(transfer.quantity)),
            referenceNo: transfer.referenceNo ?? `TRF-${transfer.id}`,
            note: `Transfer out to ${transfer.toLocation}`,
            createdBy: transfer.createdBy,
          },
        }),
        tx.stockEntry.create({
          data: {
            businessId,
            productId: transfer.productId,
            entryType: 'transfer_in',
            quantity: Math.abs(finalReceivedQty),
            referenceNo: transfer.referenceNo ?? `TRF-${transfer.id}`,
            note: `Transfer in from ${transfer.fromLocation}`,
            createdBy: transfer.createdBy,
          },
        }),
      ]);

      const variation = await tx.variation.findFirst({
        where: { productId: transfer.productId },
        select: { id: true },
      });

      if (variation) {
        const fromLoc = await tx.businessLocation.findFirst({
          where: { name: transfer.fromLocation, businessId },
          select: { id: true },
        });
        const toLoc = await tx.businessLocation.findFirst({
          where: { name: transfer.toLocation, businessId },
          select: { id: true },
        });

        if (fromLoc) {
          await this.stockService.updateStockLevel(
            variation.id,
            fromLoc.id,
            -Math.abs(Number(transfer.quantity)),
            'transfer',
            transfer.referenceNo ?? `TRF-${transfer.id}`,
            `Transfer out to ${transfer.toLocation}`,
            tx,
          );
        }
        if (toLoc) {
          await this.stockService.updateStockLevel(
            variation.id,
            toLoc.id,
            Math.abs(finalReceivedQty),
            'transfer',
            transfer.referenceNo ?? `TRF-${transfer.id}`,
            `Transfer in from ${transfer.fromLocation}`,
            tx,
          );
        }
      }

      return updated;
    });
  }

  async findAll(
    businessId: number,
    opts: {
      productId?: number;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { productId, status, page = 1, limit = 30 } = opts;
    const skip = (page - 1) * limit;
    const where = {
      businessId,
      ...(productId ? { productId } : {}),
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(businessId: number, id: number) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, businessId },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });
    if (!transfer) throw new NotFoundException(`Stock transfer #${id} not found`);
    return transfer;
  }

  async updateStatus(businessId: number, id: number, status: string) {
    const transfer = await this.findOne(businessId, id);
    if (transfer.status === status) return transfer;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockTransfer.update({
        where: { id },
        data: { status },
        include: { product: { select: { id: true, name: true, sku: true } } },
      });

      // If transition to completed or received, update stock levels if not already done
      const isNewFinalState = ['completed', 'received'].includes(status);
      const isOldFinalState = ['completed', 'received'].includes(transfer.status);

      if (isNewFinalState && !isOldFinalState) {
        const variation = await tx.variation.findFirst({
          where: { productId: transfer.productId },
          select: { id: true },
        });

        if (variation) {
          const fromLoc = await tx.businessLocation.findFirst({
            where: { name: transfer.fromLocation, businessId },
            select: { id: true },
          });
          const toLoc = await tx.businessLocation.findFirst({
            where: { name: transfer.toLocation, businessId },
            select: { id: true },
          });

          if (fromLoc) {
            await this.stockService.updateStockLevel(
              variation.id,
              fromLoc.id,
              -Math.abs(Number(transfer.quantity)),
              'transfer',
              transfer.referenceNo ?? `TRF-${transfer.id}`,
              `Transfer out to ${transfer.toLocation}`,
              tx,
            );
          }
          if (toLoc) {
            await this.stockService.updateStockLevel(
              variation.id,
              toLoc.id,
              Math.abs(Number(transfer.quantity)),
              'transfer',
              transfer.referenceNo ?? `TRF-${transfer.id}`,
              `Transfer in from ${transfer.fromLocation}`,
              tx,
            );
          }
        }
      }

      return updated;
    });
  }
}
