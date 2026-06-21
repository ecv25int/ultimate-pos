import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

const mockAccounts = [
  {
    id: 1,
    parentId: null,
    name: 'Assets',
    accountNumber: '1000',
    accountType: { rootType: 'asset' },
  },
  { id: 2, parentId: 1, name: 'Cash', accountNumber: '1010', accountType: { rootType: 'asset' } },
  {
    id: 3,
    parentId: null,
    name: 'Liabilities',
    accountNumber: '2000',
    accountType: { rootType: 'liability' },
  },
  {
    id: 4,
    parentId: 3,
    name: 'Accounts Payable',
    accountNumber: '2010',
    accountType: { rootType: 'liability' },
  },
  {
    id: 5,
    parentId: null,
    name: 'Equity',
    accountNumber: '3000',
    accountType: { rootType: 'equity' },
  },
  {
    id: 6,
    parentId: 5,
    name: 'Capital',
    accountNumber: '3010',
    accountType: { rootType: 'equity' },
  },
  {
    id: 7,
    parentId: null,
    name: 'Revenue',
    accountNumber: '4000',
    accountType: { rootType: 'revenue' },
  },
  {
    id: 8,
    parentId: 7,
    name: 'Sales',
    accountNumber: '4010',
    accountType: { rootType: 'revenue' },
  },
  {
    id: 9,
    parentId: null,
    name: 'Expenses',
    accountNumber: '5000',
    accountType: { rootType: 'expense' },
  },
  {
    id: 10,
    parentId: 9,
    name: 'COGS',
    accountNumber: '5010',
    accountType: { rootType: 'expense' },
  },
];

const mockTransactions = [
  { accountId: 2, type: 'debit', amount: '1000.0000', operationDate: new Date('2026-06-01') },
  { accountId: 4, type: 'credit', amount: '600.0000', operationDate: new Date('2026-06-02') },
  { accountId: 6, type: 'credit', amount: '300.0000', operationDate: new Date('2026-06-03') },
  { accountId: 8, type: 'credit', amount: '500.0000', operationDate: new Date('2026-06-04') },
  { accountId: 10, type: 'debit', amount: '400.0000', operationDate: new Date('2026-06-05') },
];

const mockPrismaService = {
  account: {
    findMany: jest.fn().mockResolvedValue(mockAccounts),
  },
  accountTransaction: {
    findMany: jest.fn().mockResolvedValue(mockTransactions),
  },
  expense: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  expenseCategory: {
    findMany: jest.fn(),
  },
  payment: {
    aggregate: jest.fn(),
  },
  sale: {
    aggregate: jest.fn(),
  },
  purchase: {
    aggregate: jest.fn(),
  },
};

describe('Financial Reports - ReportsService', () => {
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

  it('should compute Trial Balance correctly with hierarchy rollups', async () => {
    const result = await service.getTrialBalance(1);

    // Check that parent accounts correctly rolled up child account transactions
    const rootAsset = result.accounts.find((a) => a.id === 1);
    expect(rootAsset).toBeDefined();
    expect(rootAsset!.debit).toBe(1000);
    expect(rootAsset!.credit).toBe(0);
    expect(rootAsset!.balance).toBe(1000);

    const childAsset = rootAsset!.children.find((c) => c.id === 2);
    expect(childAsset).toBeDefined();
    expect(childAsset!.balance).toBe(1000);

    const rootLiability = result.accounts.find((a) => a.id === 3);
    expect(rootLiability!.credit).toBe(600);
    expect(rootLiability!.balance).toBe(600);

    // Sum of all root debits and credits
    expect(result.summary.totalDebit).toBe(1400); // 1000 (asset) + 400 (expense)
    expect(result.summary.totalCredit).toBe(1400); // 600 (liab) + 300 (eq) + 500 (rev)
    expect(result.summary.balancesMatch).toBe(true);
  });

  it('should compute Balance Sheet correctly and satisfy the accounting equation', async () => {
    const result = await service.getBalanceSheet(1);

    expect(result.summary.totalAssets).toBe(1000);
    expect(result.summary.totalLiabilities).toBe(600);
    expect(result.summary.totalEquity).toBe(300);
    expect(result.summary.netIncome).toBe(100); // 500 (rev) - 400 (exp)
    expect(result.summary.totalEquityWithNetIncome).toBe(400);
    expect(result.summary.equationBalances).toBe(true); // Assets (1000) === Liab (600) + Equity with Net Income (400)
  });

  it('should compute Income Statement correctly over a date range', async () => {
    const result = await service.getIncomeStatement(1, '2026-06-01', '2026-06-10');

    expect(result.summary.totalRevenue).toBe(500);
    expect(result.summary.totalExpenses).toBe(400);
    expect(result.summary.netIncome).toBe(100);
  });

  describe('getExpenseBreakdown', () => {
    it('should calculate expense breakdown correctly', async () => {
      mockPrismaService.expense.findMany.mockResolvedValueOnce([
        { id: 1, amount: 100, taxAmount: 10, totalAmount: 110, expenseCategoryId: 1 },
        { id: 2, amount: 200, taxAmount: 20, totalAmount: 220, expenseCategoryId: 2 },
      ]);
      mockPrismaService.expense.aggregate.mockResolvedValueOnce({
        _sum: { amount: 300, taxAmount: 30, totalAmount: 330 },
        _count: { id: 2 },
      });
      mockPrismaService.expense.groupBy.mockResolvedValueOnce([
        { expenseCategoryId: 1, _sum: { totalAmount: 110 }, _count: { id: 1 } },
        { expenseCategoryId: 2, _sum: { totalAmount: 220 }, _count: { id: 1 } },
      ]);
      mockPrismaService.expenseCategory.findMany.mockResolvedValueOnce([
        { id: 1, name: 'Office Utilities' },
        { id: 2, name: 'Marketing' },
      ]);

      const result = await service.getExpenseBreakdown(1);

      expect(result.summary.total).toBe(330);
      expect(result.summary.count).toBe(2);
      expect(result.byCategory).toHaveLength(2);
      expect(result.byCategory[0].categoryName).toBe('Office Utilities');
      expect(result.byCategory[0].total).toBe(110);
      expect(result.byCategory[0].percentage).toBe(33.33); // (110 / 330) * 100
      expect(result.byCategory[1].categoryName).toBe('Marketing');
      expect(result.byCategory[1].total).toBe(220);
      expect(result.byCategory[1].percentage).toBe(66.67); // (220 / 330) * 100
    });
  });

  describe('getCashFlowStatement', () => {
    it('should calculate cash flow statement correctly', async () => {
      // Mock sales payments (inflow)
      mockPrismaService.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: 5000 },
        _count: { id: 15 },
      });
      // Mock purchases payments (outflow)
      mockPrismaService.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: 2500 },
        _count: { id: 10 },
      });
      // Mock direct expenses (outflow)
      mockPrismaService.expense.aggregate.mockResolvedValueOnce({
        _sum: { totalAmount: 800 },
        _count: { id: 5 },
      });

      const result = await service.getCashFlowStatement(1);

      expect(result.summary.totalInflow).toBe(5000);
      expect(result.summary.totalOutflow).toBe(3300); // 2500 + 800
      expect(result.summary.netCashFlow).toBe(1700); // 5000 - 3300
      expect(result.operatingActivities.inflows.receiptsFromCustomers).toBe(5000);
      expect(result.operatingActivities.outflows.paymentsToSuppliers).toBe(2500);
      expect(result.operatingActivities.outflows.paymentsForExpenses).toBe(800);
    });
  });

  describe('getGSTReport', () => {
    it('should calculate GST report correctly', async () => {
      // Mock sales GST
      mockPrismaService.sale.aggregate.mockResolvedValueOnce({
        _sum: { taxAmount: 150, totalAmount: 1650 },
        _count: { id: 12 },
      });
      // Mock purchases GST
      mockPrismaService.purchase.aggregate.mockResolvedValueOnce({
        _sum: { taxAmount: 80, totalAmount: 880 },
        _count: { id: 6 },
      });
      // Mock expenses GST
      mockPrismaService.expense.aggregate.mockResolvedValueOnce({
        _sum: { taxAmount: 20, amount: 200 },
        _count: { id: 3 },
      });

      const result = await service.getGSTReport(1);

      expect(result.outputGst.gstCollected).toBe(150);
      expect(result.outputGst.taxableSales).toBe(1500); // 1650 - 150
      expect(result.inputGst.gstPaidOnPurchases).toBe(80);
      expect(result.inputGst.gstPaidOnExpenses).toBe(20);
      expect(result.inputGst.gstTotalPaid).toBe(100); // 80 + 20
      expect(result.netGstLiability).toBe(50); // 150 - 100
    });
  });
});
