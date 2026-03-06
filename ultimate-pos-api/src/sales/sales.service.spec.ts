import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebPushService } from '../push/web-push.service';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const BUSINESS_ID = 1;
const USER_ID = 1;

const mockSale = {
  id: 1,
  businessId: BUSINESS_ID,
  invoiceNo: 'SALE-20240101-0001',
  status: 'final',
  paymentStatus: 'paid',
  totalAmount: '100.00',
  paidAmount: '100.00',
  discountAmount: '0.00',
  taxAmount: '0.00',
  shippingAmount: '0.00',
  discountType: 'fixed',
  transactionDate: new Date(),
  contactId: null,
  note: null,
  deletedAt: null,
  lines: [
    {
      id: 1,
      productId: 1,
      quantity: '2',
      unitPrice: '50.00',
      lineTotal: '100.00',
      discountAmount: '0.00',
      taxAmount: '0.00',
    },
  ],
  contact: null,
};

const mockPrismaService = {
  sale: {
    count:     jest.fn(),
    create:    jest.fn(),
    findFirst: jest.fn(),
    findMany:  jest.fn(),
    update:    jest.fn(),
  },
  stockEntry: {
    create: jest.fn().mockResolvedValue({}),
  },
  saleReturn: {
    create: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
        {
          provide: NotificationsService,
          useValue: {
            sendSaleConfirmationSms: jest.fn(),
            isSmsConfigured: false,
          },
        },
        {
          provide: WebPushService,
          useValue: { sendToUser: jest.fn(), isConfigured: false },
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
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
          quantity: 2,
          unitPrice: 50,
          discountAmount: 0,
          taxAmount: 0,
        },
      ],
      paidAmount: 100,
    };

    it('creates a sale and returns it', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ next: BigInt(1) }]);
      mockPrismaService.sale.create.mockResolvedValue(mockSale);

      const result = await service.create(BUSINESS_ID, USER_ID, createDto as any);

      expect(mockPrismaService.sale.create).toHaveBeenCalledTimes(1);
      expect(result.invoiceNo).toMatch(/^SALE-/);
    });

    it('throws BadRequestException when no lines provided', async () => {
      await expect(
        service.create(BUSINESS_ID, USER_ID, { lines: [] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets paymentStatus to PAID when paidAmount >= total', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ next: BigInt(1) }]);
      mockPrismaService.sale.create.mockResolvedValue({ ...mockSale, paymentStatus: 'paid' });

      await service.create(BUSINESS_ID, USER_ID, createDto as any);

      const createCall = mockPrismaService.sale.create.mock.calls[0][0];
      expect(createCall.data.paymentStatus).toBe('paid');
    });

    it('sets paymentStatus to PARTIAL when partially paid', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ next: BigInt(1) }]);
      mockPrismaService.sale.create.mockResolvedValue({ ...mockSale, paymentStatus: 'partial' });

      await service.create(BUSINESS_ID, USER_ID, {
        ...createDto,
        paidAmount: 50,
      } as any);

      const createCall = mockPrismaService.sale.create.mock.calls[0][0];
      expect(createCall.data.paymentStatus).toBe('partial');
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated sales list', async () => {
      mockPrismaService.sale.count.mockResolvedValue(5);
      mockPrismaService.sale.findMany.mockResolvedValue([mockSale]);

      const result = await service.findAll(BUSINESS_ID, { page: 1, limit: 10 });

      expect(result.total).toBe(5);
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
    });

    it('applies search filters correctly', async () => {
      mockPrismaService.sale.count.mockResolvedValue(1);
      mockPrismaService.sale.findMany.mockResolvedValue([mockSale]);

      await service.findAll(BUSINESS_ID, { search: 'SALE-2024', status: 'final' });

      const countCall = mockPrismaService.sale.count.mock.calls[0][0];
      expect(countCall.where.status).toBe('final');
      expect(countCall.where.OR).toBeDefined();
    });

    it('returns empty list when no sales exist', async () => {
      mockPrismaService.sale.count.mockResolvedValue(0);
      mockPrismaService.sale.findMany.mockResolvedValue([]);

      const result = await service.findAll(BUSINESS_ID);

      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a sale by id', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue(mockSale);

      const result = await service.findOne(BUSINESS_ID, 1);

      expect(result.id).toBe(1);
      expect(mockPrismaService.sale.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 1, businessId: BUSINESS_ID }),
        }),
      );
    });

    it('throws NotFoundException when sale does not exist', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue(null);

      await expect(service.findOne(BUSINESS_ID, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes a sale and returns success message', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue(mockSale);
      mockPrismaService.sale.update.mockResolvedValue({ ...mockSale, deletedAt: new Date() });

      const result = await service.remove(BUSINESS_ID, 1);

      expect(result.message).toContain('deleted');
      const updateCall = mockPrismaService.sale.update.mock.calls[0][0];
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when trying to delete a non-existent sale', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue(null);

      await expect(service.remove(BUSINESS_ID, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
