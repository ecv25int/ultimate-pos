import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/update-stock-adjustment.dto';

@Injectable()
export class StockAdjustmentsService {
  constructor(private prisma: PrismaService) {}

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

    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        businessId,
        createdBy: userId,
        locationId: rest.locationId ?? null,
        referenceNo: rest.referenceNo ?? null,
        adjustmentType: rest.adjustmentType ?? 'normal',
        note: rest.note ?? null,
        status: rest.status ?? 'received',
      },
    });

    if (lines && lines.length > 0) {
      await this.prisma.stockAdjustmentLine.createMany({
        data: lines.map((l) => ({
          adjustmentId: adjustment.id,
          variationId: l.variationId ?? null,
          quantity: l.quantity,
          unitPrice: l.unitPrice ?? 0,
        })),
      });

      const totalAmount = lines.reduce(
        (sum, l) => sum + Math.abs(l.quantity) * (l.unitPrice ?? 0),
        0,
      );

      await this.prisma.stockAdjustment.update({
        where: { id: adjustment.id },
        data: { totalAmount },
      });
    }

    return this.findOne(adjustment.id, businessId);
  }

  async update(id: number, businessId: number, dto: UpdateStockAdjustmentDto) {
    await this.findOne(id, businessId);
    const { lines, ...rest } = dto;

    return this.prisma.stockAdjustment.update({
      where: { id },
      data: {
        ...(rest.locationId !== undefined && { locationId: rest.locationId }),
        ...(rest.referenceNo !== undefined && { referenceNo: rest.referenceNo }),
        ...(rest.adjustmentType !== undefined && { adjustmentType: rest.adjustmentType }),
        ...(rest.note !== undefined && { note: rest.note }),
        ...(rest.status !== undefined && { status: rest.status }),
      },
    });
  }

  async remove(id: number, businessId: number) {
    await this.findOne(id, businessId);
    return this.prisma.stockAdjustment.delete({ where: { id } });
  }
}
