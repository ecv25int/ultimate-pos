import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { WebPushService } from '../push/web-push.service';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const BUSINESS_ID = 1;
const USER_ID     = 1;

const mockPurchase = {
  id: 1,
  businessId: BUSINESS_ID,
  refNo: 'PO-20240101-0001',
  status: 'received',
  paymentStatus: 'paid',
  totalAmount: '200.00',
  paidAmount: '200.00',
  discountAmount: '0.00',
  taxAmount: '0.00',
  shippingAmount: '0.00',
  purchaseDate: new Date(),
  contactId: null,
  note: null,
  deletedAt: null,
  lines: [
    {
      id: 1,
      productId: 1,
      quantity: '4',
      unitCostBefore: '50.00',
      unitCostAfter: '50.00',
      lineTotal: '200.00',
      discountAmount: '0.00',
      taxAmount: '0.00',
    },
  ],
  contact: null,
};

const mockPrismaService = {
  purchase: {
    count:     jest.fn(),
    create:    jest.fn(),
    findFirst: jest.fn(),
    findMany:  jest.fn(),
    update:    jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  stockEntry: {
    create: jest.fn().mockResolvedValue({}),
  },
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PurchasesService', () => {
  let service: PurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
        { provide: WebPushService, useValue: { sendToUser: jest.fn().mockResolvedValue(undefined), notifyLowStock: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      lines: [
        {
          productId: 1,
          quantity: 4,
          unitCostBefore: 50,
          unitCostAfter: 50,
          discountAmount: 0,
          taxAmount: 0,
        },
      ],
      paidAmount: 200,
    };

    it('creates a purchase and returns it', async () => {
      mockPrismaService.purchase.count.mockResolvedValue(0);
      mockPrismaService.purchase.create.mockResolvedValue(mockPurchase);

      const result = await service.create(BUSINESS_ID, USER_ID, createDto as any);

      expect(mockPrismaService.purchase.create).toHaveBeenCalledTimes(1);
      expect(result.refNo).toMatch(/^PO-/);
    });

    it('throws BadRequestException when no lines provided', async () => {
      await expect(
        service.create(BUSINESS_ID, USER_ID, { lines: [] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets paymentStatus to PAID when paidAmount >= total', async () => {
      mockPrismaService.purchase.count.mockResolvedValue(0);
      mockPrismaService.purchase.create.mockResolvedValue({ ...mockPurchase, paymentStatus: 'paid' });

      await service.create(BUSINESS_ID, USER_ID, createDto as any);

      const createCall = mockPrismaService.purchase.create.mock.calls[0][0];
      expect(createCall.data.paymentStatus).toBe('paid');
    });

    it('sets paymentStatus to PARTIAL when partially paid', async () => {
      mockPrismaService.purchase.count.mockResolvedValue(0);
      mockPrismaService.purchase.create.mockResolvedValue({ ...mockPurchase, paymentStatus: 'partial' });

      await service.create(BUSINESS_ID, USER_ID, {
        ...createDto,
        paidAmount: 100,
      } as any);

      const createCall = mockPrismaService.purchase.create.mock.calls[0][0];
      expect(createCall.data.paymentStatus).toBe('partial');
    });

    it('uses provided refNo when supplied', async () => {
      mockPrismaService.purchase.count.mockResolvedValue(0);
      mockPrismaService.purchase.create.mockResolvedValue({ ...mockPurchase, refNo: 'CUSTOM-REF' });

      await service.create(BUSINESS_ID, USER_ID, { ...createDto, refNo: 'CUSTOM-REF' } as any);

      const createCall = mockPrismaService.purchase.create.mock.calls[0][0];
      expect(createCall.data.refNo).toBe('CUSTOM-REF');
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated purchases list', async () => {
      mockPrismaService.purchase.count.mockResolvedValue(3);
      mockPrismaService.purchase.findMany.mockResolvedValue([mockPurchase]);

      const result = await service.findAll(BUSINESS_ID, { page: 1, limit: 10 });

      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
    });

    it('applies status filter', async () => {
      mockPrismaService.purchase.count.mockResolvedValue(1);
      mockPrismaService.purchase.findMany.mockResolvedValue([mockPurchase]);

      await service.findAll(BUSINESS_ID, { status: 'received' });

      const countCall = mockPrismaService.purchase.count.mock.calls[0][0];
      expect(countCall.where.status).toBe('received');
    });

    it('applies search filter', async () => {
      mockPrismaService.purchase.count.mockResolvedValue(1);
      mockPrismaService.purchase.findMany.mockResolvedValue([mockPurchase]);

      await service.findAll(BUSINESS_ID, { search: 'PO-2024' });

      const countCall = mockPrismaService.purchase.count.mock.calls[0][0];
      expect(countCall.where.OR).toBeDefined();
    });

    it('returns empty when no purchases', async () => {
      mockPrismaService.purchase.count.mockResolvedValue(0);
      mockPrismaService.purchase.findMany.mockResolvedValue([]);

      const result = await service.findAll(BUSINESS_ID);

      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a purchase by id', async () => {
      mockPrismaService.purchase.findFirst.mockResolvedValue(mockPurchase);

      const result = await service.findOne(BUSINESS_ID, 1);

      expect(result.id).toBe(1);
      expect(mockPrismaService.purchase.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 1, businessId: BUSINESS_ID }),
        }),
      );
    });

    it('throws NotFoundException when purchase does not exist', async () => {
      mockPrismaService.purchase.findFirst.mockResolvedValue(null);

      await expect(service.findOne(BUSINESS_ID, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes a purchase', async () => {
      mockPrismaService.purchase.findFirst.mockResolvedValue(mockPurchase);
      mockPrismaService.purchase.update.mockResolvedValue({ ...mockPurchase, deletedAt: new Date() });

      const result = await service.remove(BUSINESS_ID, 1);

      expect(result.message).toContain('deleted');
      const updateCall = mockPrismaService.purchase.update.mock.calls[0][0];
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException for non-existent purchase', async () => {
      mockPrismaService.purchase.findFirst.mockResolvedValue(null);

      await expect(service.remove(BUSINESS_ID, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
