import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const BUSINESS_ID = 1;

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

const mockPrismaService = {
  sale: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  purchase: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  stockEntry: {
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  saleLine: {
    groupBy: jest.fn(),
  },
  expense: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  expenseCategory: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  contact: {
    findFirst: jest.fn(),
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getDashboard ──────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    const dashboardPayload = {
      totalSales: 10,
      totalRevenue: 1000,
      totalPurchases: 5,
      totalSpend: 500,
      lowStockCount: 2,
      outOfStockCount: 1,
    };

    it('returns cached result without hitting Prisma', async () => {
      mockCacheManager.get.mockResolvedValueOnce(dashboardPayload);

      const result = await service.getDashboard(BUSINESS_ID);

      expect(result).toEqual(dashboardPayload);
      expect(mockPrismaService.sale.count).not.toHaveBeenCalled();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('computes stats from Prisma and stores in cache on cache miss', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);
      mockPrismaService.sale.count.mockResolvedValue(10);
      mockPrismaService.sale.aggregate.mockResolvedValue({ _sum: { totalAmount: '1000.00' } });
      mockPrismaService.purchase.count.mockResolvedValue(5);
      mockPrismaService.purchase.aggregate.mockResolvedValue({ _sum: { totalAmount: '500.00' } });
      mockPrismaService.stockEntry.groupBy.mockResolvedValue([
        { productId: 1, _sum: { quantity: '0' } },    // out of stock
        { productId: 2, _sum: { quantity: '2' } },    // low stock (alert=5)
        { productId: 3, _sum: { quantity: '50' } },   // normal
      ]);
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 1, alertQuantity: '5' },
        { id: 2, alertQuantity: '5' },
        { id: 3, alertQuantity: '5' },
      ]);

      const result = await service.getDashboard(BUSINESS_ID) as any;

      expect(result.totalSales).toBe(10);
      expect(result.totalRevenue).toBe(1000);
      expect(result.outOfStockCount).toBe(1);
      expect(result.lowStockCount).toBe(1);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `dashboard_${BUSINESS_ID}`,
        expect.any(Object),
        300000,
      );
    });
  });

  // ─── getSalesReport ────────────────────────────────────────────────────────

  describe('getSalesReport', () => {
    const mockAgg = { _sum: { totalAmount: '2000', paidAmount: '1800', discountAmount: '0', taxAmount: '100' }, _count: { id: 4 } };
    const mockSales = [{ id: 1, invoiceNo: 'SALE-001', totalAmount: '500', contact: null, _count: { lines: 2 } }];

    beforeEach(() => {
      mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
      mockPrismaService.sale.aggregate.mockResolvedValue(mockAgg);
    });

    it('returns sales list and aggregate without date range', async () => {
      const result = await service.getSalesReport(BUSINESS_ID);

      expect(result.sales).toHaveLength(1);
      expect(result.summary).toEqual(mockAgg);
      const whereArg = mockPrismaService.sale.findMany.mock.calls[0][0].where;
      expect(whereArg.transactionDate).toBeUndefined();
    });

    it('applies from/to date filter', async () => {
      await service.getSalesReport(BUSINESS_ID, '2026-01-01', '2026-01-31');

      const whereArg = mockPrismaService.sale.findMany.mock.calls[0][0].where;
      expect(whereArg.transactionDate.gte).toEqual(new Date('2026-01-01'));
      expect(whereArg.transactionDate.lte).toEqual(new Date('2026-01-31'));
    });
  });

  // ─── getPurchasesReport ───────────────────────────────────────────────────

  describe('getPurchasesReport', () => {
    it('returns purchases and aggregate', async () => {
      mockPrismaService.purchase.findMany.mockResolvedValue([{ id: 1, refNo: 'PO-001' }]);
      mockPrismaService.purchase.aggregate.mockResolvedValue({
        _sum: { totalAmount: '800', paidAmount: '800', discountAmount: '0', taxAmount: '50' },
        _count: { id: 1 },
      });

      const result = await service.getPurchasesReport(BUSINESS_ID);

      expect(result.purchases).toHaveLength(1);
      expect(result.summary._count.id).toBe(1);
    });
  });

  // ─── getStockReport ────────────────────────────────────────────────────────

  describe('getStockReport', () => {
    it('enriches products with stock quantities and computes total value', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 1, name: 'Widget', sku: 'WGT-01', alertQuantity: '5', unit: { actualName: 'PC', shortName: 'PC' }, category: { name: 'Electronics' } },
        { id: 2, name: 'Gadget', sku: 'GDG-01', alertQuantity: '3', unit: { actualName: 'PC', shortName: 'PC' }, category: null },
      ]);
      mockPrismaService.stockEntry.groupBy.mockResolvedValue([
        { productId: 1, _sum: { quantity: '10', unitCost: '25.00' } },
        { productId: 2, _sum: { quantity: '0',  unitCost: null } },
      ]);

      const result = await service.getStockReport(BUSINESS_ID);

      expect(result.totalProducts).toBe(2);
      expect(result.products.find((p: any) => p.id === 1)!.currentStock).toBe(10);
      expect(result.products.find((p: any) => p.id === 2)!.currentStock).toBe(0);
      expect(result.totalValue).toBe(250); // 10 * 25
    });

    it('handles products with no stock entries (shows 0 stock)', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 5, name: 'Empty', sku: 'EMP', alertQuantity: '1', unit: null, category: null },
      ]);
      mockPrismaService.stockEntry.groupBy.mockResolvedValue([]);

      const result = await service.getStockReport(BUSINESS_ID);

      expect(result.products[0].currentStock).toBe(0);
      expect(result.totalValue).toBe(0);
    });
  });

  // ─── getTopProducts ────────────────────────────────────────────────────────

  describe('getTopProducts', () => {
    it('returns products sorted by quantity sold', async () => {
      mockPrismaService.saleLine.groupBy.mockResolvedValue([
        { productId: 1, _sum: { quantity: '50', lineTotal: '500' } },
        { productId: 2, _sum: { quantity: '20', lineTotal: '200' } },
      ]);
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 1, name: 'Best Seller', sku: 'BS-01' },
        { id: 2, name: 'Runner Up',  sku: 'RU-01' },
      ]);

      const result = await service.getTopProducts(BUSINESS_ID, 10);

      expect(result).toHaveLength(2);
      expect(result[0].productId).toBe(1);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(result[0].product!.name).toBe('Best Seller');
    });
  });

  // ─── getExpenseReport ─────────────────────────────────────────────────────

  describe('getExpenseReport', () => {
    it('returns expenses grouped by category', async () => {
      const mockExpenses = [
        { id: 1, amount: '100', totalAmount: '100', category: { name: 'Utilities' }, expenseDate: new Date() },
      ];
      mockPrismaService.expense.findMany.mockResolvedValue(mockExpenses);
      mockPrismaService.expense.aggregate.mockResolvedValue({
        _sum: { amount: '100', taxAmount: '0', totalAmount: '100' },
        _count: { id: 1 },
      });
      mockPrismaService.expense.groupBy.mockResolvedValue([
        { expenseCategoryId: 1, _sum: { totalAmount: '100' }, _count: { id: 1 } },
      ]);
      mockPrismaService.expenseCategory.findMany.mockResolvedValue([{ id: 1, name: 'Utilities' }]);

      const result = await service.getExpenseReport(BUSINESS_ID) as any;

      expect(result.expenses).toHaveLength(1);
      expect(result.summary.count).toBe(1);
      expect(result.byCategory).toHaveLength(1);
      expect(result.byCategory[0].categoryName).toBe('Utilities');
    });
  });

  // ─── getProfitLoss ────────────────────────────────────────────────────────

  describe('getProfitLoss', () => {
    it('computes grossRevenue, grossProfit, netProfit, and margins', async () => {
      // totalRevenue=1000, COGS=600, totalExpenses=100 → grossProfit=400, netProfit=300
      mockPrismaService.sale.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: '1000', discountAmount: '0', taxAmount: '80' } });
      mockPrismaService.purchase.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: '600' } });
      mockPrismaService.expense.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: '100' } });

      const result = await service.getProfitLoss(BUSINESS_ID) as any;

      expect(result.grossRevenue).toBe(1000);
      expect(result.totalCOGS).toBe(600);
      expect(result.grossProfit).toBe(400);
      expect(result.totalExpenses).toBe(100);
      expect(result.netProfit).toBe(300);
      expect(result.grossMarginPct).toBeCloseTo(40);
      expect(result.netMarginPct).toBeCloseTo(30);
    });

    it('returns zero margins when grossRevenue is zero', async () => {
      mockPrismaService.sale.aggregate.mockResolvedValue({ _sum: { totalAmount: null } });
      mockPrismaService.purchase.aggregate.mockResolvedValue({ _sum: { totalAmount: null } });
      mockPrismaService.expense.aggregate.mockResolvedValue({ _sum: { totalAmount: null } });

      const result = await service.getProfitLoss(BUSINESS_ID) as any;

      expect(result.grossRevenue).toBe(0);
      expect(result.grossMarginPct).toBe(0);
      expect(result.netMarginPct).toBe(0);
    });
  });
});
