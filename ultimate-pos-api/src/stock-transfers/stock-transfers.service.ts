import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';

@Injectable()
export class StockTransfersService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: number, userId: number, dto: CreateStockTransferDto) {
    // Verify product belongs to business
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, businessId },
    });
    if (!product) throw new NotFoundException(`Product #${dto.productId} not found`);

    const transfer = await this.prisma.stockTransfer.create({
      data: {
        businessId,
        productId: dto.productId,
        quantity: dto.quantity,
        fromLocation: dto.fromLocation,
        toLocation: dto.toLocation,
        referenceNo: dto.referenceNo ?? null,
        note: dto.note ?? null,
        status: dto.status ?? 'completed',
        createdBy: userId,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    // If completed, create stock entries: out from source, in to destination
    if (transfer.status === 'completed') {
      await Promise.all([
        this.prisma.stockEntry.create({
          data: {
            businessId,
            productId: dto.productId,
            entryType: 'transfer_out',
            quantity: -Math.abs(dto.quantity),
            referenceNo: dto.referenceNo ?? `TRF-${transfer.id}`,
            note: `Transfer out to ${dto.toLocation}`,
            createdBy: userId,
          },
        }),
        this.prisma.stockEntry.create({
          data: {
            businessId,
            productId: dto.productId,
            entryType: 'transfer_in',
            quantity: Math.abs(dto.quantity),
            referenceNo: dto.referenceNo ?? `TRF-${transfer.id}`,
            note: `Transfer in from ${dto.fromLocation}`,
            createdBy: userId,
          },
        }),
      ]);
    }

    return transfer;
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
    await this.findOne(businessId, id);
    return this.prisma.stockTransfer.update({
      where: { id },
      data: { status },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });
  }
}
