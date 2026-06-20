import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  public async isDefaultLocation(businessId: number, locationId: number): Promise<boolean> {
    const defaultLoc = await this.prisma.businessLocation.findFirst({
      where: { businessId, isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    return defaultLoc?.id === locationId;
  }

  public async getSaleInvoiceNosByLocation(
    businessId: number,
    locationId: number,
  ): Promise<string[]> {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        businessId,
        locationId,
        type: 'sale',
      },
      select: {
        referenceNo: true,
      },
    });
    const invoiceNos = movements
      .map((m) => m.referenceNo)
      .filter((ref): ref is string => typeof ref === 'string');

    const isDefault = await this.isDefaultLocation(businessId, locationId);
    if (isDefault) {
      const allMovements = await this.prisma.stockMovement.findMany({
        where: { businessId, type: 'sale' },
        select: { referenceNo: true },
      });
      const movedInvoices = new Set(allMovements.map((m) => m.referenceNo).filter(Boolean));

      const allSales = await this.prisma.sale.findMany({
        where: { businessId, deletedAt: null },
        select: { invoiceNo: true },
      });
      const nonMovedInvoices = allSales
        .map((s) => s.invoiceNo)
        .filter((inv) => !movedInvoices.has(inv));

      invoiceNos.push(...nonMovedInvoices);
    }
    return invoiceNos;
  }

  public async getPurchaseRefNosByLocation(
    businessId: number,
    locationId: number,
  ): Promise<string[]> {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        businessId,
        locationId,
        type: 'purchase',
      },
      select: {
        referenceNo: true,
      },
    });
    const refNos = movements
      .map((m) => m.referenceNo)
      .filter((ref): ref is string => typeof ref === 'string');

    const isDefault = await this.isDefaultLocation(businessId, locationId);
    if (isDefault) {
      const allMovements = await this.prisma.stockMovement.findMany({
        where: { businessId, type: 'purchase' },
        select: { referenceNo: true },
      });
      const movedRefs = new Set(allMovements.map((m) => m.referenceNo).filter(Boolean));

      const allPurchases = await this.prisma.purchase.findMany({
        where: { businessId, deletedAt: null },
        select: { refNo: true },
      });
      const nonMovedRefs = allPurchases
        .map((p) => p.refNo)
        .filter((ref): ref is string => typeof ref === 'string' && !movedRefs.has(ref));

      refNos.push(...nonMovedRefs);
    }
    return refNos;
  }

  /** Sales report with multi-layered filters and totals summary */
  async getSalesReport(
    businessId: number,
    fromDate?: string | Date,
    toDate?: string | Date,
    filters?: { locationId?: number; contactId?: number; status?: string; paymentStatus?: string },
  ) {
    const where: Prisma.SaleWhereInput = {
      businessId,
      deletedAt: null,
      type: 'sale',
    };
    if (fromDate || toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.transactionDate = dateFilter;
    }
    if (filters?.contactId) {
      where.contactId = filters.contactId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters?.locationId) {
      const invoiceNos = await this.getSaleInvoiceNosByLocation(businessId, filters.locationId);
      where.invoiceNo = { in: invoiceNos };
    }

    const [sales, aggregate] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        include: {
          contact: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.sale.aggregate({
        where,
        _sum: { totalAmount: true, paidAmount: true, taxAmount: true, discountAmount: true },
        _count: { id: true },
      }),
    ]);

    const summary = {
      salesCount: aggregate._count.id,
      totalAmount: Number(aggregate._sum.totalAmount ?? 0),
      totalPaid: Number(aggregate._sum.paidAmount ?? 0),
      totalTax: Number(aggregate._sum.taxAmount ?? 0),
      totalDiscount: Number(aggregate._sum.discountAmount ?? 0),
      totalDue: Math.max(
        0,
        Number(aggregate._sum.totalAmount ?? 0) - Number(aggregate._sum.paidAmount ?? 0),
      ),
    };

    return { sales, summary };
  }

  /** Customer sales breakdowns */
  async getCustomerSalesBreakdown(businessId: number, filters?: { contactId?: number }) {
    const customers = await this.prisma.contact.findMany({
      where: {
        businessId,
        type: 'customer',
        id: filters?.contactId,
      },
      include: {
        sales: {
          where: { deletedAt: null, type: 'sale' },
          select: {
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
    });

    return customers.map((c) => {
      const salesCount = c.sales.length;
      const totalSpent = c.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const totalPaid = c.sales.reduce((sum, s) => sum + Number(s.paidAmount), 0);
      const totalDue = Math.max(0, totalSpent - totalPaid);
      const averageOrderValue = salesCount > 0 ? totalSpent / salesCount : 0;

      return {
        customerId: c.id,
        customerName: c.name,
        salesCount,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalDue: Math.round(totalDue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      };
    });
  }

  /** Product sales analysis including fast & slow movers */
  async getProductSalesAnalysis(
    businessId: number,
    filters?: { fromDate?: string | Date; toDate?: string | Date; locationId?: number },
  ) {
    const saleWhere: Prisma.SaleWhereInput = {
      businessId,
      deletedAt: null,
      type: 'sale',
    };
    if (filters?.fromDate || filters?.toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.fromDate) dateFilter.gte = new Date(filters.fromDate);
      if (filters.toDate) dateFilter.lte = new Date(filters.toDate);
      saleWhere.transactionDate = dateFilter;
    }
    if (filters?.locationId) {
      const invoiceNos = await this.getSaleInvoiceNosByLocation(businessId, filters.locationId);
      saleWhere.invoiceNo = { in: invoiceNos };
    }

    const saleLines = await this.prisma.saleLine.findMany({
      where: {
        sale: saleWhere,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    const groups: Record<
      number,
      { productId: number; name: string; sku: string; quantitySold: number; totalRevenue: number }
    > = {};
    for (const line of saleLines) {
      const pId = line.productId;
      if (!groups[pId]) {
        groups[pId] = {
          productId: pId,
          name: line.product.name,
          sku: line.product.sku,
          quantitySold: 0,
          totalRevenue: 0,
        };
      }
      groups[pId].quantitySold += Number(line.quantity);
      groups[pId].totalRevenue += Number(line.lineTotal);
    }

    const items = Object.values(groups).map((item) => ({
      ...item,
      quantitySold: Math.round(item.quantitySold * 10000) / 10000,
      totalRevenue: Math.round(item.totalRevenue * 100) / 100,
      averageUnitPrice:
        item.quantitySold > 0 ? Math.round((item.totalRevenue / item.quantitySold) * 100) / 100 : 0,
    }));

    const trending = [...items].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);
    const slowMovers = [...items].sort((a, b) => a.quantitySold - b.quantitySold).slice(0, 10);

    return { products: items, trending, slowMovers };
  }

  /** Recurring Invoices configuration & schedule report */
  async getRecurringInvoiceReport(businessId: number, filters?: { status?: string }) {
    const recurringSales = await this.prisma.sale.findMany({
      where: {
        businessId,
        isRecurring: true,
        deletedAt: null,
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        contact: { select: { id: true, name: true } },
        recurChildren: {
          select: {
            id: true,
            transactionDate: true,
            totalAmount: true,
          },
        },
      },
    });

    return recurringSales.map((s) => {
      const generatedCount = s.recurChildren.length;
      const totalGeneratedAmount = s.recurChildren.reduce(
        (sum, child) => sum + Number(child.totalAmount),
        0,
      );

      let lastGeneratedDate = s.transactionDate;
      if (s.recurChildren.length > 0) {
        lastGeneratedDate = s.recurChildren.reduce((max, child) => {
          return child.transactionDate > max ? child.transactionDate : max;
        }, s.recurChildren[0].transactionDate);
      }

      let nextRecurDate: Date | null = null;
      if (!s.recurStoppedOn || lastGeneratedDate < s.recurStoppedOn) {
        const next = new Date(lastGeneratedDate);
        const interval = Number(s.recurInterval ?? 1);
        if (s.recurIntervalType === 'days') {
          next.setDate(next.getDate() + interval);
        } else if (s.recurIntervalType === 'months') {
          next.setMonth(next.getMonth() + interval);
        } else if (s.recurIntervalType === 'years') {
          next.setFullYear(next.getFullYear() + interval);
        }
        nextRecurDate = next;
      }

      return {
        id: s.id,
        invoiceNo: s.invoiceNo,
        customerName: s.contact?.name ?? null,
        totalAmount: Number(s.totalAmount),
        isRecurring: s.isRecurring,
        recurInterval: Number(s.recurInterval ?? 0),
        recurIntervalType: s.recurIntervalType,
        recurRepetitions: s.recurRepetitions,
        recurStoppedOn: s.recurStoppedOn,
        generatedCount,
        totalGeneratedAmount: Math.round(totalGeneratedAmount * 100) / 100,
        lastGeneratedDate,
        nextRecurDate,
        status: s.status,
      };
    });
  }

  /** Purchase report with location, supplier, and status filters */
  async getPurchaseReport(
    businessId: number,
    fromDate?: string | Date,
    toDate?: string | Date,
    filters?: { locationId?: number; contactId?: number; status?: string },
  ) {
    const where: Prisma.PurchaseWhereInput = {
      businessId,
      deletedAt: null,
      type: 'purchase',
    };
    if (fromDate || toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.purchaseDate = dateFilter;
    }
    if (filters?.contactId) {
      where.contactId = filters.contactId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.locationId) {
      const refNos = await this.getPurchaseRefNosByLocation(businessId, filters.locationId);
      where.refNo = { in: refNos };
    }

    const [purchases, aggregate] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        orderBy: { purchaseDate: 'desc' },
        include: {
          contact: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.purchase.aggregate({
        where,
        _sum: { totalAmount: true, paidAmount: true, taxAmount: true, discountAmount: true },
        _count: { id: true },
      }),
    ]);

    const summary = {
      purchasesCount: aggregate._count.id,
      totalAmount: Number(aggregate._sum.totalAmount ?? 0),
      totalPaid: Number(aggregate._sum.paidAmount ?? 0),
      totalTax: Number(aggregate._sum.taxAmount ?? 0),
      totalDiscount: Number(aggregate._sum.discountAmount ?? 0),
      totalDue: Math.max(
        0,
        Number(aggregate._sum.totalAmount ?? 0) - Number(aggregate._sum.paidAmount ?? 0),
      ),
    };

    return { purchases, summary };
  }

  /** Supplier analysis */
  async getSupplierAnalysis(businessId: number, filters?: { contactId?: number }) {
    const suppliers = await this.prisma.contact.findMany({
      where: {
        businessId,
        type: 'supplier',
        id: filters?.contactId,
      },
      include: {
        purchases: {
          where: { deletedAt: null, type: 'purchase' },
          select: {
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
    });

    return suppliers.map((s) => {
      const purchasesCount = s.purchases.length;
      const totalSpend = s.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
      const totalPaid = s.purchases.reduce((sum, p) => sum + Number(p.paidAmount), 0);
      const totalDue = Math.max(0, totalSpend - totalPaid);

      return {
        supplierId: s.id,
        supplierName: s.name,
        purchasesCount,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalDue: Math.round(totalDue * 100) / 100,
      };
    });
  }

  /** Cost of Goods Sold (COGS) report using FIFO mapping costs */
  async getCostOfGoodsReport(
    businessId: number,
    fromDate?: string | Date,
    toDate?: string | Date,
    filters?: { locationId?: number },
  ) {
    const saleWhere: Prisma.SaleWhereInput = {
      businessId,
      deletedAt: null,
      status: 'final',
      type: 'sale',
    };
    if (fromDate || toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      saleWhere.transactionDate = dateFilter;
    }
    if (filters?.locationId) {
      const invoiceNos = await this.getSaleInvoiceNosByLocation(businessId, filters.locationId);
      saleWhere.invoiceNo = { in: invoiceNos };
    }

    const saleLines = await this.prisma.saleLine.findMany({
      where: {
        sale: saleWhere,
      },
      include: {
        sellLinesPurchaseLines: {
          include: {
            purchaseLine: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCogs = 0;

    for (const line of saleLines) {
      totalRevenue += Number(line.lineTotal);

      if (line.sellLinesPurchaseLines.length > 0) {
        for (const mapping of line.sellLinesPurchaseLines) {
          const qty = Number(mapping.quantity);
          const unitCost = Number(mapping.purchaseLine.unitCostAfter);
          totalCogs += qty * unitCost;
        }
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      fromDate: fromDate ?? null,
      toDate: toDate ?? null,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCogs: Math.round(totalCogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
    };
  }

  /** Optimized Stock Valuation report supporting historical stock backdating */
  async getStockReport(
    businessId: number,
    asOfDate?: string | Date,
    filters?: { locationId?: number; productId?: number },
  ) {
    const variations = await this.prisma.variation.findMany({
      where: {
        product: {
          businessId,
          id: filters?.productId,
        },
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            enableStock: true,
          },
        },
        purchaseLines: {
          orderBy: { id: 'desc' },
          take: 1,
          select: { unitCostAfter: true },
        },
      },
    });

    const report = [];

    for (const v of variations) {
      if (!v.product.enableStock) continue;

      let qtyAvailable = 0;

      if (asOfDate) {
        const movementsSum = await this.prisma.stockMovement.aggregate({
          where: {
            businessId,
            variationId: v.id,
            createdAt: { lte: new Date(asOfDate) },
            ...(filters?.locationId && { locationId: filters.locationId }),
          },
          _sum: { quantity: true },
        });
        qtyAvailable = Number(movementsSum._sum.quantity ?? 0);
      } else {
        const locDetails = await this.prisma.variationLocationDetails.findMany({
          where: {
            variationId: v.id,
            ...(filters?.locationId && { locationId: filters.locationId }),
          },
        });
        qtyAvailable = locDetails.reduce((sum, d) => sum + Number(d.qtyAvailable), 0);
      }

      const unitCost = Number(v.purchaseLines[0]?.unitCostAfter ?? 0);
      const valuation = qtyAvailable * unitCost;

      report.push({
        variationId: v.id,
        productId: v.productId,
        productName: v.product.name,
        sku: v.product.sku,
        subSku: v.subSku,
        qtyAvailable: Math.round(qtyAvailable * 10000) / 10000,
        unitCost: Math.round(unitCost * 100) / 100,
        valuation: Math.round(valuation * 100) / 100,
      });
    }

    return report;
  }

  /** Expiry Report evaluating batches near or past expiration */
  async getExpiryReport(businessId: number, filters?: { locationId?: number }) {
    let purchaseRefNos: string[] | undefined = undefined;
    if (filters?.locationId) {
      purchaseRefNos = await this.getPurchaseRefNosByLocation(businessId, filters.locationId);
    }

    const purchaseLines = await this.prisma.purchaseLine.findMany({
      where: {
        purchase: {
          businessId,
          deletedAt: null,
          ...(purchaseRefNos !== undefined && { refNo: { in: purchaseRefNos } }),
        },
        expiryDate: { not: null },
      },
      include: {
        product: { select: { name: true, sku: true } },
        purchase: { select: { refNo: true, purchaseDate: true } },
      },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return purchaseLines
      .map((line) => {
        const qty = Number(line.quantity);
        const sold = Number(line.quantitySold);
        const adj = Number(line.quantityAdjusted);
        const remainingQty = qty - sold - adj;

        if (remainingQty <= 0) return null;

        const expiry = line.expiryDate!;
        let status = 'active';
        if (expiry < now) {
          status = 'expired';
        } else if (expiry <= thirtyDaysFromNow) {
          status = 'expiring_soon';
        }

        return {
          purchaseLineId: line.id,
          productId: line.productId,
          productName: line.product.name,
          sku: line.product.sku,
          batchNumber: line.batchNumber ?? null,
          expiryDate: expiry,
          remainingQty: Math.round(remainingQty * 10000) / 10000,
          purchaseRefNo: line.purchase.refNo,
          purchaseDate: line.purchase.purchaseDate,
          status,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  /** Chronological Stock Movement Logs */
  async getStockMovementHistory(
    businessId: number,
    filters?: {
      productId?: number;
      variationId?: number;
      locationId?: number;
      fromDate?: string | Date;
      toDate?: string | Date;
    },
  ) {
    const where: Prisma.StockMovementWhereInput = {
      businessId,
    };
    if (filters?.variationId) {
      where.variationId = filters.variationId;
    } else if (filters?.productId) {
      const variations = await this.prisma.variation.findMany({
        where: { productId: filters.productId },
        select: { id: true },
      });
      where.variationId = { in: variations.map((v) => v.id) };
    }
    if (filters?.locationId) {
      where.locationId = filters.locationId;
    }
    if (filters?.fromDate || filters?.toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.fromDate) dateFilter.gte = new Date(filters.fromDate);
      if (filters.toDate) dateFilter.lte = new Date(filters.toDate);
      where.createdAt = dateFilter;
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        variation: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
        location: { select: { id: true, name: true } },
      },
    });

    return movements.map((m) => ({
      id: m.id,
      date: m.createdAt,
      variationId: m.variationId,
      productName: m.variation.product.name,
      sku: m.variation.product.sku,
      subSku: m.variation.subSku,
      locationId: m.locationId,
      locationName: m.location.name,
      type: m.type,
      quantity: Number(m.quantity),
      referenceNo: m.referenceNo,
      note: m.note,
    }));
  }

  /** Slow-moving stock report */
  async getSlowMovingStock(businessId: number, filters?: { locationId?: number; days?: number }) {
    const days = filters?.days ?? 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const stockDetails = await this.prisma.variationLocationDetails.findMany({
      where: {
        variation: {
          product: { businessId },
        },
        ...(filters?.locationId && { locationId: filters.locationId }),
      },
      include: {
        variation: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    const salesSums = await this.prisma.saleLine.groupBy({
      by: ['variationId'],
      where: {
        sale: {
          businessId,
          deletedAt: null,
          status: 'final',
          type: 'sale',
          transactionDate: { gte: sinceDate },
        },
      },
      _sum: { quantity: true },
    });

    const salesMap = new Map<number, number>();
    for (const s of salesSums) {
      if (s.variationId) {
        salesMap.set(s.variationId, Number(s._sum.quantity ?? 0));
      }
    }

    return stockDetails
      .map((detail) => {
        const qtyAvailable = Number(detail.qtyAvailable);
        const variationId = detail.variationId;
        const soldQty = salesMap.get(variationId) ?? 0;

        if (qtyAvailable > 0 && soldQty <= 2) {
          return {
            variationId,
            productId: detail.productId,
            productName: detail.variation.product.name,
            sku: detail.variation.product.sku,
            subSku: detail.variation.subSku,
            locationId: detail.locationId,
            qtyAvailable,
            soldQtyLastNDays: soldQty,
            daysEvaluated: days,
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }
}
