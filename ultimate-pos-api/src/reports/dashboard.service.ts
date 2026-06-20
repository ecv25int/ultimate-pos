import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounting/accounts.service';
import { ReportingService } from './reporting.service';
import { UserRole } from '../auth/enums/user-role.enum';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly reportingService: ReportingService,
  ) {}

  /**
   * Retrieves today's KPI metrics and analytical trend charts
   */
  async getDashboardData(businessId: number, userId: number, role: string, locationId?: number) {
    const isFinancialAllowed = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(
      role as UserRole,
    );

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Sales revenue today (accessible to all roles, but location filtered if requested)
    let saleInvoiceNos: string[] = [];
    if (locationId) {
      saleInvoiceNos = await this.reportingService.getSaleInvoiceNosByLocation(
        businessId,
        locationId,
      );
    }

    const todaySales = await this.prisma.sale.aggregate({
      where: {
        businessId,
        deletedAt: null,
        type: 'sale',
        status: 'final',
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        ...(locationId ? { invoiceNo: { in: saleInvoiceNos } } : {}),
      },
      _sum: {
        totalAmount: true,
      },
    });

    const todaySalesRevenue = Number(todaySales._sum.totalAmount ?? 0);

    // If cashier or non-privileged role, return ONLY sales revenue and default trend/heatmap
    if (!isFinancialAllowed) {
      const salesTrend = await this.getSalesTrend(businessId, locationId, saleInvoiceNos);
      const productMix = await this.getProductMix(businessId, locationId, saleInvoiceNos);
      const inventoryHeatmap = await this.getInventoryHeatmap(businessId, locationId);

      return {
        todaySalesRevenue,
        todayProfit: null,
        pendingAR: null,
        pendingAP: null,
        inventoryValue: null,
        cashPosition: null,
        salesTrend,
        productMix,
        inventoryHeatmap,
      };
    }

    // 2. Today's Profit: Sales revenue today - COGS today - Expenses today
    // Query today's finalized sale lines to calculate COGS
    const saleLines = await this.prisma.saleLine.findMany({
      where: {
        sale: {
          businessId,
          deletedAt: null,
          type: 'sale',
          status: 'final',
          transactionDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          ...(locationId ? { invoiceNo: { in: saleInvoiceNos } } : {}),
        },
      },
      include: {
        sellLinesPurchaseLines: {
          include: {
            purchaseLine: true,
          },
        },
      },
    });

    let todayCogs = 0;
    for (const line of saleLines) {
      if (line.sellLinesPurchaseLines && line.sellLinesPurchaseLines.length > 0) {
        for (const mapping of line.sellLinesPurchaseLines) {
          const qty = Number(mapping.quantity ?? 0);
          const cost = Number(mapping.purchaseLine?.unitCostAfter ?? 0);
          todayCogs += qty * cost;
        }
      }
    }

    // Query today's expenses (expenses cannot be location filtered as they don't have location_id)
    const todayExpenses = await this.prisma.expense.aggregate({
      where: {
        businessId,
        deletedAt: null,
        expenseDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });
    const expensesAmt = Number(todayExpenses._sum.totalAmount ?? 0);
    const todayProfit = todaySalesRevenue - todayCogs - expensesAmt;

    // 3. Pending AR: Sum totalAmount - paidAmount for sales unpaid/partial
    const pendingSales = await this.prisma.sale.aggregate({
      where: {
        businessId,
        deletedAt: null,
        type: 'sale',
        status: 'final',
        paymentStatus: { in: ['due', 'partial'] },
        ...(locationId ? { invoiceNo: { in: saleInvoiceNos } } : {}),
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });
    const pendingAR = Math.max(
      0,
      Number(pendingSales._sum.totalAmount ?? 0) - Number(pendingSales._sum.paidAmount ?? 0),
    );

    // 4. Pending AP: Sum totalAmount - paidAmount for purchases unpaid/partial
    let purchaseRefNos: string[] = [];
    if (locationId) {
      purchaseRefNos = await this.reportingService.getPurchaseRefNosByLocation(
        businessId,
        locationId,
      );
    }

    const pendingPurchases = await this.prisma.purchase.aggregate({
      where: {
        businessId,
        deletedAt: null,
        status: { not: 'cancelled' },
        paymentStatus: { in: ['due', 'partial'] },
        ...(locationId ? { refNo: { in: purchaseRefNos } } : {}),
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });
    const pendingAP = Math.max(
      0,
      Number(pendingPurchases._sum.totalAmount ?? 0) -
        Number(pendingPurchases._sum.paidAmount ?? 0),
    );

    // 5. Inventory Value: Sum qtyAvailable * unitCost
    const stockDetails = await this.prisma.variationLocationDetails.findMany({
      where: {
        location: {
          businessId,
          isActive: true,
        },
        ...(locationId ? { locationId } : {}),
      },
      include: {
        variation: {
          select: {
            defaultPurchasePrice: true,
          },
        },
      },
    });
    let inventoryValue = 0;
    for (const item of stockDetails) {
      const qty = Number(item.qtyAvailable ?? 0);
      const cost = Number(item.variation?.defaultPurchasePrice ?? 0);
      inventoryValue += qty * cost;
    }

    // 6. Cash Position: Sum balances of Cash/Bank accounts ('1010', '1020')
    const ledgerAccounts = await this.prisma.account.findMany({
      where: {
        businessId,
        accountNumber: { in: ['1010', '1020'] },
        isClosed: false,
      },
      select: {
        id: true,
      },
    });
    let cashPosition = 0;
    for (const acc of ledgerAccounts) {
      const bal = await this.accountsService.getAccountBalance(acc.id);
      cashPosition += bal;
    }

    // Analytics data
    const salesTrend = await this.getSalesTrend(businessId, locationId, saleInvoiceNos);
    const productMix = await this.getProductMix(businessId, locationId, saleInvoiceNos);
    const inventoryHeatmap = await this.getInventoryHeatmap(businessId, locationId);

    return {
      todaySalesRevenue: Math.round(todaySalesRevenue * 100) / 100,
      todayProfit: Math.round(todayProfit * 100) / 100,
      pendingAR: Math.round(pendingAR * 100) / 100,
      pendingAP: Math.round(pendingAP * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      cashPosition: Math.round(cashPosition * 100) / 100,
      salesTrend,
      productMix,
      inventoryHeatmap,
    };
  }

  /**
   * Helper: calculates last 30 days daily sales trend
   */
  private async getSalesTrend(
    businessId: number,
    locationId?: number,
    saleInvoiceNos: string[] = [],
  ) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        deletedAt: null,
        type: 'sale',
        status: 'final',
        transactionDate: {
          gte: thirtyDaysAgo,
        },
        ...(locationId ? { invoiceNo: { in: saleInvoiceNos } } : {}),
      },
      select: {
        totalAmount: true,
        transactionDate: true,
      },
    });

    // Generate last 30 days dictionary
    const trendMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap.set(dateStr, 0);
    }

    // Sum sales into dates
    for (const sale of sales) {
      const dateStr = sale.transactionDate.toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        trendMap.set(dateStr, trendMap.get(dateStr)! + Number(sale.totalAmount ?? 0));
      }
    }

    // Convert to sorted array
    const result = Array.from(trendMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));
    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }

  /**
   * Helper: Top 5 revenue-driving products
   */
  private async getProductMix(
    businessId: number,
    locationId?: number,
    saleInvoiceNos: string[] = [],
  ) {
    const lines = await this.prisma.saleLine.findMany({
      where: {
        sale: {
          businessId,
          deletedAt: null,
          type: 'sale',
          status: 'final',
          ...(locationId ? { invoiceNo: { in: saleInvoiceNos } } : {}),
        },
      },
      select: {
        lineTotal: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    const mixMap = new Map<string, number>();
    for (const line of lines) {
      const name = line.product?.name ?? 'Unknown Product';
      mixMap.set(name, (mixMap.get(name) ?? 0) + Number(line.lineTotal ?? 0));
    }

    const mixArray = Array.from(mixMap.entries()).map(([product, revenue]) => ({
      product,
      revenue: Math.round(revenue * 100) / 100,
    }));

    mixArray.sort((a, b) => b.revenue - a.revenue);
    return mixArray.slice(0, 5);
  }

  /**
   * Helper: Top 10 location-variation stock levels heatmap
   */
  private async getInventoryHeatmap(businessId: number, locationId?: number) {
    const stockDetails = await this.prisma.variationLocationDetails.findMany({
      where: {
        location: {
          businessId,
          isActive: true,
        },
        ...(locationId ? { locationId } : {}),
      },
      include: {
        location: {
          select: {
            name: true,
          },
        },
        variation: {
          select: {
            name: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        qtyAvailable: 'desc',
      },
      take: 10,
    });

    return stockDetails.map((item) => {
      const productName = item.variation?.product?.name ?? 'Unknown Product';
      const varName = item.variation?.name ?? '';
      const fullName = varName && varName !== 'DUMMY' ? `${productName} (${varName})` : productName;
      return {
        location: item.location?.name ?? 'Unknown Location',
        product: fullName,
        quantity: Number(item.qtyAvailable ?? 0),
      };
    });
  }
}
