import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ── Create a stock entry ─────────────────────────────────────────────────────
  async createEntry(userId: number, businessId: number, dto: CreateStockEntryDto) {
    // Verify product belongs to business
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, businessId },
    });
    if (!product) {
      throw new NotFoundException(`Product #${dto.productId} not found in your business`);
    }
    if (!product.enableStock) {
      throw new BadRequestException(`Stock tracking is not enabled for "${product.name}"`);
    }

    return this.prisma.stockEntry.create({
      data: {
        businessId,
        productId: dto.productId,
        entryType: dto.entryType,
        quantity: dto.quantity,
        unitCost: dto.unitCost ?? null,
        referenceNo: dto.referenceNo ?? null,
        note: dto.note ?? null,
        createdBy: userId,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });
  }

  // ── Stock overview: all stock-enabled products with their current qty ────────
  async getStockOverview(businessId: number, search?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        businessId,
        enableStock: true,
        ...(search ? { name: { contains: search } } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        brand:    { select: { id: true, name: true } },
        unit:     { select: { id: true, actualName: true, shortName: true } },
        stockEntries: {
          select: { quantity: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => {
      const currentStock = p.stockEntries.reduce(
        (sum, e) => sum + Number(e.quantity),
        0,
      );
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        type: p.type,
        alertQuantity: Number(p.alertQuantity),
        currentStock,
        isLowStock: currentStock <= Number(p.alertQuantity),
        category: p.category,
        brand: p.brand,
        unit: p.unit,
      };
    });
  }

  // ── Stock history for one product ────────────────────────────────────────────
  async getProductHistory(
    productId: number,
    businessId: number,
    limit = 50,
  ) {
    // Verify product belongs to business
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
    });
    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }

    const entries = await this.prisma.stockEntry.findMany({
      where: { productId, businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const currentStock = entries.reduce((sum, e) => sum + Number(e.quantity), 0);

    return {
      product: { id: product.id, name: product.name, sku: product.sku },
      currentStock,
      entries,
    };
  }

  // ── Delete a single stock entry (e.g., mistake correction) ──────────────────
  async deleteEntry(entryId: number, businessId: number) {
    const entry = await this.prisma.stockEntry.findFirst({
      where: { id: entryId, businessId },
    });
    if (!entry) {
      throw new NotFoundException(`Stock entry #${entryId} not found`);
    }
    await this.prisma.stockEntry.delete({ where: { id: entryId } });
    return { message: 'Stock entry deleted' };
  }

  // ── Summary stats for dashboard ─────────────────────────────────────────────
  async getSummary(businessId: number) {
    const stockEnabledProducts = await this.prisma.product.findMany({
      where: { businessId, enableStock: true },
      include: { stockEntries: { select: { quantity: true } } },
    });

    let totalProducts = stockEnabledProducts.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const p of stockEnabledProducts) {
      const qty = p.stockEntries.reduce((s, e) => s + Number(e.quantity), 0);
      if (qty <= 0) outOfStockCount++;
      else if (qty <= Number(p.alertQuantity)) lowStockCount++;

      // Estimate stock value from last purchase cost
      const lastPurchase = await this.prisma.stockEntry.findFirst({
        where: { productId: p.id, businessId, unitCost: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { unitCost: true },
      });
      if (lastPurchase?.unitCost) {
        totalStockValue += Math.max(qty, 0) * Number(lastPurchase.unitCost);
      }
    }

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      adequateStock: totalProducts - lowStockCount - outOfStockCount,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
    };
  }

  /**
   * List stock adjustment entries (adjustment_in / adjustment_out) paginated
   */
  async getAdjustments(
    businessId: number,
    page = 1,
    limit = 30,
    productId?: number,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      businessId,
      entryType: { in: ['adjustment_in', 'adjustment_out'] as string[] },
      ...(productId ? { productId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      }),
      this.prisma.stockEntry.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
