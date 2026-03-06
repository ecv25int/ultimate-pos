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
    // Fetch products and aggregate stock quantities in parallel — two queries
    // instead of loading every stock entry row into memory.
    const [products, stockAgg] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          businessId,
          enableStock: true,
          ...(search ? { name: { contains: search } } : {}),
        },
        select: {
          id: true,
          name: true,
          sku: true,
          type: true,
          alertQuantity: true,
          category: { select: { id: true, name: true } },
          brand:    { select: { id: true, name: true } },
          unit:     { select: { id: true, actualName: true, shortName: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.stockEntry.groupBy({
        by: ['productId'],
        where: { businessId },
        _sum: { quantity: true },
      }),
    ]);

    const stockMap = new Map(
      stockAgg.map((s) => [s.productId, Number(s._sum.quantity ?? 0)]),
    );

    return products.map((p) => {
      const currentStock = stockMap.get(p.id) ?? 0;
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
    // Single groupBy for stock quantities — avoids loading all StockEntry rows
    const [products, stockAgg, lastCostRows] = await Promise.all([
      this.prisma.product.findMany({
        where: { businessId, enableStock: true },
        select: { id: true, alertQuantity: true },
      }),
      this.prisma.stockEntry.groupBy({
        by: ['productId'],
        where: { businessId },
        _sum: { quantity: true },
      }),
      // Last known unit cost per product (1 query instead of 1 per product)
      this.prisma.$queryRaw<{ product_id: number; unit_cost: number }[]>`
        SELECT product_id, unit_cost
        FROM stock_entries
        WHERE business_id = ${businessId}
          AND unit_cost IS NOT NULL
          AND id IN (
            SELECT MAX(id)
            FROM stock_entries
            WHERE business_id = ${businessId} AND unit_cost IS NOT NULL
            GROUP BY product_id
          )
      `,
    ]);

    const stockMap = new Map(
      stockAgg.map((s) => [s.productId, Number(s._sum.quantity ?? 0)]),
    );
    const costMap = new Map(
      lastCostRows.map((r) => [Number(r.product_id), Number(r.unit_cost)]),
    );

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const p of products) {
      const qty = stockMap.get(p.id) ?? 0;
      if (qty <= 0) outOfStockCount++;
      else if (qty <= Number(p.alertQuantity)) lowStockCount++;

      const cost = costMap.get(p.id);
      if (cost) totalStockValue += Math.max(qty, 0) * cost;
    }

    const totalProducts = products.length;
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
