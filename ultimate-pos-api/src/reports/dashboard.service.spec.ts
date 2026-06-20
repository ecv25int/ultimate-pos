import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounting/accounts.service';
import { ReportingService } from './reporting.service';
import { UserRole } from '../auth/enums/user-role.enum';

const mockPrismaService = {
  sale: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  saleLine: {
    findMany: jest.fn(),
  },
  expense: {
    aggregate: jest.fn(),
  },
  purchase: {
    aggregate: jest.fn(),
  },
  variationLocationDetails: {
    findMany: jest.fn(),
  },
  account: {
    findMany: jest.fn(),
  },
};

const mockAccountsService = {
  getAccountBalance: jest.fn(),
};

const mockReportingService = {
  getSaleInvoiceNosByLocation: jest.fn(),
  getPurchaseRefNosByLocation: jest.fn(),
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: ReportingService, useValue: mockReportingService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardData for non-privileged roles (cashier)', () => {
    it('should only return today sales revenue and hide other financial KPIs', async () => {
      // Mock sales revenue aggregate
      mockPrismaService.sale.aggregate.mockResolvedValueOnce({
        _sum: { totalAmount: 1500.5 },
      });

      // Mock trend, product mix and heatmap queries
      mockPrismaService.sale.findMany.mockResolvedValueOnce([
        { totalAmount: 1000, transactionDate: new Date() },
        { totalAmount: 500.5, transactionDate: new Date() },
      ]);
      mockPrismaService.saleLine.findMany.mockResolvedValueOnce([]);
      mockPrismaService.variationLocationDetails.findMany.mockResolvedValueOnce([]);

      const result = await service.getDashboardData(1, 10, UserRole.CASHIER);

      expect(result.todaySalesRevenue).toBe(1500.5);
      expect(result.todayProfit).toBeNull();
      expect(result.pendingAR).toBeNull();
      expect(result.pendingAP).toBeNull();
      expect(result.inventoryValue).toBeNull();
      expect(result.cashPosition).toBeNull();
      expect(result.salesTrend).toBeDefined();
      expect(result.productMix).toBeDefined();
      expect(result.inventoryHeatmap).toBeDefined();
    });
  });

  describe('getDashboardData for privileged roles (admin)', () => {
    it('should compute and return all financial KPIs and analytical charts', async () => {
      // 1. Sales revenue aggregate
      mockPrismaService.sale.aggregate.mockResolvedValueOnce({
        _sum: { totalAmount: 2000 }, // today sales
      });

      // 2. COGS (sale lines with purchase lines mapping)
      mockPrismaService.saleLine.findMany.mockResolvedValueOnce([
        {
          lineTotal: 2000,
          sellLinesPurchaseLines: [
            {
              quantity: 2,
              purchaseLine: { unitCostAfter: 400 }, // COGS = 800
            },
          ],
        },
      ]);

      // 3. Expenses aggregate
      mockPrismaService.expense.aggregate.mockResolvedValueOnce({
        _sum: { totalAmount: 300 }, // expense = 300
      });

      // 4. Pending AR (unpaid sales)
      mockPrismaService.sale.aggregate.mockResolvedValueOnce({
        _sum: { totalAmount: 5000, paidAmount: 4200 }, // AR = 800
      });

      // 5. Pending AP (unpaid purchases)
      mockPrismaService.purchase.aggregate.mockResolvedValueOnce({
        _sum: { totalAmount: 3000, paidAmount: 2500 }, // AP = 500
      });

      // 6. Inventory value
      mockPrismaService.variationLocationDetails.findMany.mockImplementation(
        (params: Record<string, any>) => {
          const include = params?.include as Record<string, any> | undefined;
          if (include?.variation) {
            return [
              {
                qtyAvailable: 10,
                variation: { defaultPurchasePrice: 50 }, // inventoryValue = 500
              },
            ];
          }
          // Second call for heatmap
          return [
            {
              qtyAvailable: 10,
              location: { name: 'Main Store' },
              variation: {
                name: 'V1',
                product: { name: 'Prod A' },
              },
            },
          ];
        },
      );

      // 7. Cash Position accounts
      mockPrismaService.account.findMany.mockResolvedValueOnce([{ id: 101 }, { id: 102 }]);
      mockAccountsService.getAccountBalance.mockResolvedValue(500); // cash position = 1000

      // 8. Trends and mix mocks
      mockPrismaService.sale.findMany.mockResolvedValueOnce([]); // sales trend
      mockPrismaService.saleLine.findMany.mockResolvedValueOnce([]); // product mix

      const result = await service.getDashboardData(1, 10, UserRole.ADMIN);

      expect(result.todaySalesRevenue).toBe(2000);
      expect(result.todayProfit).toBe(900); // 2000 - 800 (cogs) - 300 (expenses) = 900
      expect(result.pendingAR).toBe(800);
      expect(result.pendingAP).toBe(500);
      expect(result.inventoryValue).toBe(500);
      expect(result.cashPosition).toBe(1000);
      expect(result.salesTrend).toHaveLength(30);
      expect(result.productMix).toBeDefined();
      expect(result.inventoryHeatmap).toBeDefined();
    });
  });
});
