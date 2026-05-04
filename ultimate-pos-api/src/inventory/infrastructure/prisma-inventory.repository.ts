import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockEntryMapper } from './stock-entry.mapper';
import type {
  IInventoryRepository,
  CreateEntryData,
  InventorySummary,
  PaginatedEntries,
  ProductInfo,
  ProductStockInfo,
} from '../domain/inventory.repository';
import type { StockEntry } from '../domain/stock-entry.entity';

const PRODUCT_STOCK_SELECT = {
  id: true,
  name: true,
  sku: true,
  type: true,
  alertQuantity: true,
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  unit: { select: { id: true, actualName: true, shortName: true } },
} as const;

@Injectable()
export class PrismaInventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStockLevel(productId: number, businessId: number): Promise<number> {
    const agg = await this.prisma.stockEntry.aggregate({
      where: { productId, businessId },
      _sum: { quantity: true },
    });
    return Number(agg._sum.quantity ?? 0);
  }

  async getStockOverview(businessId: number, search?: string): Promise<ProductStockInfo[]> {
    const [products, stockAgg] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          businessId,
          enableStock: true,
          ...(search ? { name: { contains: search } } : {}),
        },
        select: PRODUCT_STOCK_SELECT,
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
      const alertQty = Number(p.alertQuantity);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        type: p.type,
        alertQuantity: alertQty,
        currentStock,
        isLowStock: currentStock <= alertQty,
        category: p.category ?? null,
        brand: p.brand ?? null,
        unit: p.unit ?? null,
      };
    });
  }

  async getLowStockItems(businessId: number): Promise<ProductStockInfo[]> {
    const all = await this.getStockOverview(businessId);
    return all.filter((p) => p.isLowStock);
  }

  async getProductHistory(productId: number, businessId: number, limit: number): Promise<StockEntry[]> {
    const rows = await this.prisma.stockEntry.findMany({
      where: { productId, businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(StockEntryMapper.toEntity);
  }

  async getSummary(businessId: number): Promise<InventorySummary> {
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

    const stockMap = new Map(stockAgg.map((s) => [s.productId, Number(s._sum.quantity ?? 0)]));
    const costMap = new Map(lastCostRows.map((r) => [Number(r.product_id), Number(r.unit_cost)]));

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const p of products) {
      const qty = stockMap.get(p.id) ?? 0;
      const alertQty = Number(p.alertQuantity);
      if (qty <= 0) outOfStockCount++;
      else if (qty <= alertQty) lowStockCount++;
      const cost = costMap.get(p.id);
      if (cost) totalStockValue += Math.max(qty, 0) * cost;
    }

    return {
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      adequateStock: products.length - lowStockCount - outOfStockCount,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
    };
  }

  async getAdjustments(businessId: number, page: number, limit: number, productId?: number): Promise<PaginatedEntries> {
    const skip = (page - 1) * limit;
    const where = {
      businessId,
      entryType: { in: ['adjustment_in', 'adjustment_out'] as string[] },
      ...(productId ? { productId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.stockEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { product: { select: { id: true, name: true, sku: true } } },
      }),
      this.prisma.stockEntry.count({ where }),
    ]);

    return {
      data: rows.map(StockEntryMapper.toEntity),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createEntry(businessId: number, userId: number, data: CreateEntryData): Promise<StockEntry> {
    const row = await this.prisma.stockEntry.create({
      data: {
        businessId,
        productId: data.productId,
        entryType: data.entryType,
        quantity: data.quantity,
        unitCost: data.unitCost ?? null,
        referenceNo: data.referenceNo ?? null,
        note: data.note ?? null,
        createdBy: userId,
      },
    });
    return StockEntryMapper.toEntity(row);
  }

  async deleteEntry(entryId: number, _businessId: number): Promise<void> {
    await this.prisma.stockEntry.delete({ where: { id: entryId } });
  }

  async findProduct(productId: number, businessId: number): Promise<ProductInfo | null> {
    const row = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
      select: { id: true, name: true, enableStock: true, alertQuantity: true },
    });
    if (!row) return null;
    return { id: row.id, name: row.name, enableStock: row.enableStock, alertQuantity: Number(row.alertQuantity) };
  }

  async findEntry(entryId: number, businessId: number): Promise<StockEntry | null> {
    const row = await this.prisma.stockEntry.findFirst({
      where: { id: entryId, businessId },
    });
    return row ? StockEntryMapper.toEntity(row) : null;
  }
}
