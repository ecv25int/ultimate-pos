import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from './reporting.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  businessLocation: {
    findFirst: jest.fn(),
  },
  stockMovement: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  sale: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  contact: {
    findMany: jest.fn(),
  },
  saleLine: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  purchase: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  variation: {
    findMany: jest.fn(),
  },
  purchaseLine: {
    findMany: jest.fn(),
  },
  variationLocationDetails: {
    findMany: jest.fn(),
  },
};

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
    jest.clearAllMocks();
  });

  describe('getSalesReport', () => {
    it('should aggregate and return sales list and summary', async () => {
      mockPrismaService.sale.findMany.mockResolvedValueOnce([
        {
          id: 1,
          invoiceNo: 'INV-1',
          totalAmount: '100',
          paidAmount: '80',
          contact: { name: 'Alice' },
        },
      ]);
      mockPrismaService.sale.aggregate.mockResolvedValueOnce({
        _count: { id: 1 },
        _sum: { totalAmount: 100, paidAmount: 80, taxAmount: 10, discountAmount: 5 },
      });

      const result = await service.getSalesReport(1, '2026-06-01', '2026-06-30');
      expect(result.sales).toHaveLength(1);
      expect(result.summary.salesCount).toBe(1);
      expect(result.summary.totalAmount).toBe(100);
      expect(result.summary.totalPaid).toBe(80);
      expect(result.summary.totalDue).toBe(20);
    });
  });

  describe('getCustomerSalesBreakdown', () => {
    it('should calculate breakdown per customer', async () => {
      mockPrismaService.contact.findMany.mockResolvedValueOnce([
        {
          id: 5,
          name: 'Bob',
          sales: [
            { totalAmount: '150', paidAmount: '100' },
            { totalAmount: '250', paidAmount: '250' },
          ],
        },
      ]);

      const result = await service.getCustomerSalesBreakdown(1);
      expect(result).toHaveLength(1);
      expect(result[0].customerId).toBe(5);
      expect(result[0].salesCount).toBe(2);
      expect(result[0].totalSpent).toBe(400);
      expect(result[0].totalPaid).toBe(350);
      expect(result[0].totalDue).toBe(50);
      expect(result[0].averageOrderValue).toBe(200);
    });
  });

  describe('getProductSalesAnalysis', () => {
    it('should calculate products performance and identify trending vs slow movers', async () => {
      mockPrismaService.saleLine.findMany.mockResolvedValueOnce([
        {
          productId: 10,
          quantity: '5',
          lineTotal: '100',
          product: { name: 'Widget A', sku: 'W1' },
        },
        { productId: 11, quantity: '1', lineTotal: '50', product: { name: 'Widget B', sku: 'W2' } },
      ]);

      const result = await service.getProductSalesAnalysis(1);
      expect(result.products).toHaveLength(2);
      expect(result.trending[0].productId).toBe(10);
      expect(result.slowMovers[0].productId).toBe(11);
    });
  });

  describe('getRecurringInvoiceReport', () => {
    it('should return recurring schedules and calculate next recur date', async () => {
      const parentDate = new Date('2026-06-01T12:00:00Z');
      mockPrismaService.sale.findMany.mockResolvedValueOnce([
        {
          id: 100,
          invoiceNo: 'REC-1',
          totalAmount: '120',
          isRecurring: true,
          recurInterval: '1',
          recurIntervalType: 'months',
          recurRepetitions: 12,
          recurStoppedOn: null,
          status: 'final',
          transactionDate: parentDate,
          contact: { name: 'Charlie' },
          recurChildren: [
            { id: 101, transactionDate: new Date('2026-07-01T12:00:00Z'), totalAmount: '120' },
          ],
        },
      ]);

      const result = await service.getRecurringInvoiceReport(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(100);
      expect(result[0].generatedCount).toBe(1);
      expect(result[0].totalGeneratedAmount).toBe(120);
      expect(result[0].nextRecurDate!.getUTCMonth()).toBe(7); // August (since last generated is July 1st)
    });
  });

  describe('getPurchaseReport', () => {
    it('should sum purchase values correctly', async () => {
      mockPrismaService.purchase.findMany.mockResolvedValueOnce([
        {
          id: 2,
          refNo: 'PO-1',
          totalAmount: '500',
          paidAmount: '500',
          contact: { name: 'Supplier A' },
        },
      ]);
      mockPrismaService.purchase.aggregate.mockResolvedValueOnce({
        _count: { id: 1 },
        _sum: { totalAmount: 500, paidAmount: 500, taxAmount: 50, discountAmount: 10 },
      });

      const result = await service.getPurchaseReport(1);
      expect(result.purchases).toHaveLength(1);
      expect(result.summary.purchasesCount).toBe(1);
      expect(result.summary.totalAmount).toBe(500);
      expect(result.summary.totalDue).toBe(0);
    });
  });

  describe('getSupplierAnalysis', () => {
    it('should summarize supplier metrics', async () => {
      mockPrismaService.contact.findMany.mockResolvedValueOnce([
        {
          id: 8,
          name: 'Supplier X',
          purchases: [{ totalAmount: '1000', paidAmount: '800' }],
        },
      ]);

      const result = await service.getSupplierAnalysis(1);
      expect(result).toHaveLength(1);
      expect(result[0].supplierId).toBe(8);
      expect(result[0].totalSpend).toBe(1000);
      expect(result[0].totalDue).toBe(200);
    });
  });

  describe('getCostOfGoodsReport', () => {
    it('should aggregate revenue and calculate COGS using FIFO mappings', async () => {
      mockPrismaService.saleLine.findMany.mockResolvedValueOnce([
        {
          lineTotal: '150',
          sellLinesPurchaseLines: [{ quantity: '2', purchaseLine: { unitCostAfter: '40' } }],
        },
      ]);

      const result = await service.getCostOfGoodsReport(1);
      expect(result.totalRevenue).toBe(150);
      expect(result.totalCogs).toBe(80); // 2 * 40 = 80
      expect(result.grossProfit).toBe(70); // 150 - 80 = 70
      expect(result.grossProfitMargin).toBeCloseTo(46.67);
    });
  });

  describe('getStockReport', () => {
    it('should lookup variation stock levels and evaluate valuation', async () => {
      mockPrismaService.variation.findMany.mockResolvedValueOnce([
        {
          id: 50,
          productId: 10,
          subSku: 'SKU-50',
          product: { name: 'Item Alpha', sku: 'A1', enableStock: true },
          purchaseLines: [{ unitCostAfter: '15.50' }],
        },
      ]);
      mockPrismaService.variationLocationDetails.findMany.mockResolvedValueOnce([
        { qtyAvailable: '10' },
      ]);

      const result = await service.getStockReport(1);
      expect(result).toHaveLength(1);
      expect(result[0].variationId).toBe(50);
      expect(result[0].qtyAvailable).toBe(10);
      expect(result[0].valuation).toBe(155); // 10 * 15.5 = 155
    });
  });

  describe('getExpiryReport', () => {
    it('should list expiring batches from purchase lines', async () => {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 15); // expiring in 15 days

      mockPrismaService.purchaseLine.findMany.mockResolvedValueOnce([
        {
          id: 99,
          productId: 10,
          batchNumber: 'B-123',
          expiryDate: expiry,
          quantity: '100',
          quantitySold: '90',
          quantityAdjusted: '0',
          product: { name: 'Product A', sku: 'P1' },
          purchase: { refNo: 'PO-10', purchaseDate: new Date() },
        },
      ]);

      const result = await service.getExpiryReport(1);
      expect(result).toHaveLength(1);
      expect(result[0].batchNumber).toBe('B-123');
      expect(result[0].remainingQty).toBe(10);
      expect(result[0].status).toBe('expiring_soon');
    });
  });

  describe('getStockMovementHistory', () => {
    it('should log stock movements chronologically', async () => {
      mockPrismaService.stockMovement.findMany.mockResolvedValueOnce([
        {
          id: 1,
          createdAt: new Date(),
          variationId: 50,
          locationId: 1,
          type: 'sale',
          quantity: '-5',
          referenceNo: 'INV-1',
          note: 'Sale out',
          variation: { subSku: 'SKU-50', product: { name: 'Product Alpha', sku: 'A1' } },
          location: { id: 1, name: 'Main Location' },
        },
      ]);

      const result = await service.getStockMovementHistory(1);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('sale');
      expect(result[0].quantity).toBe(-5);
    });
  });

  describe('getSlowMovingStock', () => {
    it('should list stock with low turnover', async () => {
      mockPrismaService.variationLocationDetails.findMany.mockResolvedValueOnce([
        {
          productId: 10,
          variationId: 50,
          qtyAvailable: '20',
          variation: { subSku: 'SKU-50', product: { id: 10, name: 'Widget A', sku: 'W1' } },
        },
      ]);
      mockPrismaService.saleLine.groupBy.mockResolvedValueOnce([
        { variationId: 50, _sum: { quantity: 1 } }, // only 1 unit sold
      ]);

      const result = await service.getSlowMovingStock(1);
      expect(result).toHaveLength(1);
      expect(result[0].variationId).toBe(50);
      expect(result[0].soldQtyLastNDays).toBe(1);
    });
  });
});
