import { Test, TestingModule } from '@nestjs/testing';
import { AgingService } from './aging.service';
import { PrismaService } from '../prisma/prisma.service';

const mockSupplier1 = { id: 1, name: 'Supplier A' };
const mockSupplier2 = { id: 2, name: 'Supplier B' };
const mockCustomer1 = { id: 10, name: 'Customer X' };
const mockCustomer2 = { id: 11, name: 'Customer Y' };

const mockPurchases = [
  // 1. Fully paid purchase, should be excluded
  {
    id: 1,
    contactId: 1,
    contact: mockSupplier1,
    totalAmount: '100.0000',
    purchaseDate: new Date('2026-06-01T12:00:00Z'),
    payments: [{ amount: '100.0000', paymentDate: new Date('2026-06-02T12:00:00Z') }],
  },
  // 2. Outstanding purchase: current bucket (10 days old as of 2026-06-21)
  {
    id: 2,
    contactId: 1,
    contact: mockSupplier1,
    totalAmount: '500.0000',
    purchaseDate: new Date('2026-06-11T12:00:00Z'),
    payments: [{ amount: '200.0000', paymentDate: new Date('2026-06-12T12:00:00Z') }],
  },
  // 3. Outstanding purchase: 30+ bucket (40 days old as of 2026-06-21)
  {
    id: 3,
    contactId: 1,
    contact: mockSupplier1,
    totalAmount: '350.0000',
    purchaseDate: new Date('2026-05-12T12:00:00Z'),
    payments: [],
  },
  // 4. Outstanding purchase: 60+ bucket (70 days old as of 2026-06-21)
  {
    id: 4,
    contactId: 2,
    contact: mockSupplier2,
    totalAmount: '1000.0000',
    purchaseDate: new Date('2026-04-12T12:00:00Z'),
    payments: [{ amount: '400.0000', paymentDate: new Date('2026-04-15T12:00:00Z') }],
  },
  // 5. Outstanding purchase: 90+ bucket (100 days old as of 2026-06-21)
  {
    id: 5,
    contactId: 2,
    contact: mockSupplier2,
    totalAmount: '750.0000',
    purchaseDate: new Date('2026-03-13T12:00:00Z'),
    payments: [],
  },
];

const mockSales = [
  // 1. Fully paid sale, should be excluded
  {
    id: 1,
    contactId: 10,
    contact: mockCustomer1,
    totalAmount: '120.0000',
    transactionDate: new Date('2026-06-01T12:00:00Z'),
    payments: [{ amount: '120.0000', paymentDate: new Date('2026-06-02T12:00:00Z') }],
  },
  // 2. Outstanding sale: current bucket (5 days old as of 2026-06-21)
  {
    id: 2,
    contactId: 10,
    contact: mockCustomer1,
    totalAmount: '450.0000',
    transactionDate: new Date('2026-06-16T12:00:00Z'),
    payments: [],
  },
  // 3. Outstanding sale: 30+ bucket (35 days old as of 2026-06-21)
  {
    id: 3,
    contactId: 10,
    contact: mockCustomer1,
    totalAmount: '600.0000',
    transactionDate: new Date('2026-05-17T12:00:00Z'),
    payments: [{ amount: '100.0000', paymentDate: new Date('2026-05-18T12:00:00Z') }],
  },
  // 4. Outstanding sale: 60+ bucket (75 days old as of 2026-06-21)
  {
    id: 4,
    contactId: 11,
    contact: mockCustomer2,
    totalAmount: '2000.0000',
    transactionDate: new Date('2026-04-07T12:00:00Z'),
    payments: [],
  },
];

const mockPrismaService = {
  purchase: {
    findMany: jest.fn().mockResolvedValue(mockPurchases),
  },
  sale: {
    findMany: jest.fn().mockResolvedValue(mockSales),
  },
};

describe('AgingService', () => {
  let service: AgingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgingService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AgingService>(AgingService);
    jest.clearAllMocks();
  });

  describe('getAPAging', () => {
    it('should calculate AP aging by buckets and group by supplier', async () => {
      const asOfDate = new Date('2026-06-21T12:00:00Z');
      const result = await service.getAPAging(1, asOfDate);

      // Verify prisma call parameters
      expect(mockPrismaService.purchase.findMany).toHaveBeenCalledWith({
        where: {
          businessId: 1,
          deletedAt: null,
          type: 'purchase',
          purchaseDate: { lte: asOfDate },
        },
        include: {
          contact: { select: { id: true, name: true } },
          payments: {
            where: { paymentDate: { lte: asOfDate } },
            select: { amount: true },
          },
        },
      });

      // Supplier A (mockSupplier1):
      // - Purchase 1: outstanding 0 (fully paid) -> excluded
      // - Purchase 2: total 500, paid 200 -> outstanding 300 (current bucket, 10 days old)
      // - Purchase 3: total 350, paid 0 -> outstanding 350 (30+ bucket, 40 days old)
      // Total Outstanding = 650.00
      const supplierA = result.contacts.find((c) => c.contactId === 1);
      expect(supplierA).toBeDefined();
      expect(supplierA?.contactName).toBe('Supplier A');
      expect(supplierA?.current).toBe(300);
      expect(supplierA?.['30+']).toBe(350);
      expect(supplierA?.['60+']).toBe(0);
      expect(supplierA?.['90+']).toBe(0);
      expect(supplierA?.totalOutstanding).toBe(650);

      // Supplier B (mockSupplier2):
      // - Purchase 4: total 1000, paid 400 -> outstanding 600 (60+ bucket, 70 days old)
      // - Purchase 5: total 750, paid 0 -> outstanding 750 (90+ bucket, 100 days old)
      // Total Outstanding = 1350.00
      const supplierB = result.contacts.find((c) => c.contactId === 2);
      expect(supplierB).toBeDefined();
      expect(supplierB?.contactName).toBe('Supplier B');
      expect(supplierB?.current).toBe(0);
      expect(supplierB?.['30+']).toBe(0);
      expect(supplierB?.['60+']).toBe(600);
      expect(supplierB?.['90+']).toBe(750);
      expect(supplierB?.totalOutstanding).toBe(1350);

      // Verify summary totals
      expect(result.summary.current).toBe(300);
      expect(result.summary['30+']).toBe(350);
      expect(result.summary['60+']).toBe(600);
      expect(result.summary['90+']).toBe(750);
      expect(result.summary.totalOutstanding).toBe(2000);

      // Contacts should be sorted by totalOutstanding desc: Supplier B (1350) then Supplier A (650)
      expect(result.contacts[0].contactId).toBe(2);
      expect(result.contacts[1].contactId).toBe(1);
    });

    it('should exclude payments made after the asOfDate from calculations', async () => {
      // If we request asOfDate 2026-06-11
      // Purchase 2 (total 500, paid 200 on 2026-06-12) -> payment is after asOfDate, outstanding = 500
      // Mock search is controlled by query, but let's test logic behavior on custom asOfDate
      const asOfDate = new Date('2026-06-11T12:00:00Z');

      // We will override prisma mock return value for this test
      mockPrismaService.purchase.findMany.mockResolvedValueOnce([
        {
          id: 2,
          contactId: 1,
          contact: mockSupplier1,
          totalAmount: '500.0000',
          purchaseDate: new Date('2026-06-11T12:00:00Z'),
          payments: [], // Filtered out by paymentDate <= asOfDate in real query
        },
      ]);

      const result = await service.getAPAging(1, asOfDate);
      const supplierA = result.contacts.find((c) => c.contactId === 1);
      expect(supplierA?.totalOutstanding).toBe(500);
      expect(supplierA?.current).toBe(500);
    });
  });

  describe('getARAging', () => {
    it('should calculate AR aging by buckets and group by customer', async () => {
      const asOfDate = new Date('2026-06-21T12:00:00Z');
      const result = await service.getARAging(1, asOfDate);

      // Verify prisma call parameters
      expect(mockPrismaService.sale.findMany).toHaveBeenCalledWith({
        where: {
          businessId: 1,
          deletedAt: null,
          type: 'sale',
          transactionDate: { lte: asOfDate },
        },
        include: {
          contact: { select: { id: true, name: true } },
          payments: {
            where: { paymentDate: { lte: asOfDate } },
            select: { amount: true },
          },
        },
      });

      // Customer X (mockCustomer1):
      // - Sale 1: outstanding 0 (fully paid) -> excluded
      // - Sale 2: total 450 -> outstanding 450 (current, 5 days old)
      // - Sale 3: total 600, paid 100 -> outstanding 500 (30+, 35 days old)
      // Total Outstanding = 950.00
      const customerX = result.contacts.find((c) => c.contactId === 10);
      expect(customerX).toBeDefined();
      expect(customerX?.contactName).toBe('Customer X');
      expect(customerX?.current).toBe(450);
      expect(customerX?.['30+']).toBe(500);
      expect(customerX?.totalOutstanding).toBe(950);

      // Customer Y (mockCustomer2):
      // - Sale 4: total 2000 -> outstanding 2000 (60+, 75 days old)
      // Total Outstanding = 2000.00
      const customerY = result.contacts.find((c) => c.contactId === 11);
      expect(customerY).toBeDefined();
      expect(customerY?.contactName).toBe('Customer Y');
      expect(customerY?.current).toBe(0);
      expect(customerY?.['30+']).toBe(0);
      expect(customerY?.['60+']).toBe(2000);
      expect(customerY?.['90+']).toBe(0);
      expect(customerY?.totalOutstanding).toBe(2000);

      // Verify summary totals
      expect(result.summary.current).toBe(450);
      expect(result.summary['30+']).toBe(500);
      expect(result.summary['60+']).toBe(2000);
      expect(result.summary['90+']).toBe(0);
      expect(result.summary.totalOutstanding).toBe(2950);

      // Customer Y (2000) should be first, then Customer X (950)
      expect(result.contacts[0].contactId).toBe(11);
      expect(result.contacts[1].contactId).toBe(10);
    });
  });
});
