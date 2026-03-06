import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from '../sales/sales.service';
import { CreateSaleDto, SaleStatus, PaymentStatus } from '../sales/dto/create-sale.dto';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private salesService: SalesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Search products for the POS product picker
   */
  async searchProducts(businessId: number, query?: string) {
    // Only cache the full (no-filter) product list; per-query results skip cache
    const cacheKey = `pos_products_${businessId}`;
    if (!query) {
      const cached = await this.cacheManager.get<object[]>(cacheKey);
      if (cached) return cached;
    }

    const where: any = { businessId, enableStock: true };
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
      ];
    }
    const products = await this.prisma.product.findMany({
      where,
      take: 30,
      include: {
        unit: { select: { shortName: true } },
        category: { select: { name: true } },
      },
    });

    // Attach current stock for each product
    const withStock = await Promise.all(
      products.map(async (p) => {
        const agg = await this.prisma.stockEntry.aggregate({
          where: { productId: p.id, businessId },
          _sum: { quantity: true },
        });
        return {
          ...p,
          currentStock: agg._sum.quantity ?? 0,
        };
      }),
    );

    if (!query) {
      await this.cacheManager.set(cacheKey, withStock, 60000); // 1 min
    }
    return withStock;
  }

  /**
   * Process a POS transaction — creates a Sale + decrements stock
   */
  async processTransaction(businessId: number, userId: number, dto: CreateSaleDto) {
    // Mark as final & use paid status if fully paid
    const finalDto: CreateSaleDto = {
      ...dto,
      status: SaleStatus.FINAL,
    };
    return this.salesService.create(businessId, userId, finalDto);
  }

  /**
   * Get recent POS transactions (last 50)
   */
  async getRecentTransactions(businessId: number) {
    return this.prisma.sale.findMany({
      where: { businessId, deletedAt: null, status: 'final' },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNo: true,
        totalAmount: true,
        paidAmount: true,
        paymentStatus: true,
        transactionDate: true,
        contact: { select: { name: true } },
        lines: { select: { id: true } },
      },
    });
  }

  /**
   * Exact barcode / SKU lookup — used by hardware barcode scanners.
   * Returns null if not found (never throws 404 so the UI can handle gracefully).
   */
  async scanByBarcode(businessId: number, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { businessId, sku: barcode },
      include: {
        unit: { select: { shortName: true } },
        category: { select: { name: true } },
      },
    });
    if (!product) return null;

    const agg = await this.prisma.stockEntry.aggregate({
      where: { productId: product.id, businessId },
      _sum: { quantity: true },
    });
    return { ...product, currentStock: agg._sum.quantity ?? 0 };
  }
}
