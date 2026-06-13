/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BatchService } from './batch.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from './stock.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('BatchService', () => {
  let service: BatchService;
  let prisma: any;
  let stockService: any;

  const prismaMock = {
    purchase: {
      create: jest.fn(),
    },
    purchaseLine: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    variation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    businessLocation: {
      findFirst: jest.fn(),
    },
    transactionSellLinesPurchaseLines: {
      create: jest.fn(),
    },
    stockAdjustment: {
      create: jest.fn(),
    },
    stockAdjustmentLine: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMock)),
  };

  const stockServiceMock = {
    updateStockLevel: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: StockService, useValue: stockServiceMock },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    prisma = module.get<PrismaService>(PrismaService);
    stockService = module.get<StockService>(StockService);
  });

  describe('trackBatch', () => {
    it('should update quantity if batch already exists', async () => {
      prisma.purchaseLine.findFirst.mockResolvedValue({
        id: 1,
        quantity: new Decimal(10),
        expiryDate: new Decimal(0), // placeholder
      });
      prisma.purchaseLine.update.mockResolvedValue({ id: 1 });

      const expiry = new Date();
      await service.trackBatch(1, 'BATCH01', expiry, 5, 1);

      expect(prisma.purchaseLine.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          quantity: 15,
          expiryDate: expiry,
        },
      });
    });

    it('should create new batch and opening stock purchase if batch does not exist', async () => {
      prisma.purchaseLine.findFirst.mockResolvedValue(null);
      prisma.variation.findUnique.mockResolvedValue({ id: 1, productId: 10 });
      prisma.purchase.create.mockResolvedValue({ id: 500 });
      prisma.purchaseLine.create.mockResolvedValue({ id: 99 });

      const expiry = new Date();
      await service.trackBatch(1, 'BATCH01', expiry, 5, 1);

      expect(prisma.purchaseLine.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 10,
            variationId: 1,
            quantity: 5,
            batchNumber: 'BATCH01',
            expiryDate: expiry,
          }),
        }),
      );
    });
  });

  describe('getPurchaseLineForBatch', () => {
    it('should find purchase line by variation and batch number', async () => {
      prisma.purchaseLine.findFirst.mockResolvedValue({ id: 1 });
      const result = await service.getPurchaseLineForBatch(1, 'BATCH01');
      expect(result).toEqual({ id: 1 });
      expect(prisma.purchaseLine.findFirst).toHaveBeenCalledWith({
        where: { variationId: 1, batchNumber: 'BATCH01' },
        include: { purchase: true },
      });
    });
  });

  describe('checkExpiryItems', () => {
    it('should generate warning and expired alerts correctly', async () => {
      const today = new Date();
      const expiredDate = new Date();
      expiredDate.setDate(today.getDate() - 2);

      const warningDate = new Date();
      warningDate.setDate(today.getDate() + 3);

      const normalDate = new Date();
      normalDate.setDate(today.getDate() + 15);

      prisma.purchaseLine.findMany.mockResolvedValue([
        {
          id: 1,
          productId: 10,
          variationId: 100,
          batchNumber: 'B1',
          expiryDate: expiredDate,
          quantity: new Decimal(10),
          quantitySold: new Decimal(2),
          quantityAdjusted: new Decimal(1),
          product: { name: 'P1', sku: 'S1' },
          variation: { name: 'V1', subSku: 'S1-V1' },
          purchase: { refNo: 'REF1', locationId: 2 },
        },
        {
          id: 2,
          productId: 20,
          variationId: 200,
          batchNumber: 'B2',
          expiryDate: warningDate,
          quantity: new Decimal(5),
          quantitySold: new Decimal(0),
          quantityAdjusted: new Decimal(0),
          product: { name: 'P2', sku: 'S2' },
          variation: { name: 'V2', subSku: 'S2-V2' },
          purchase: { refNo: 'REF2', locationId: 2 },
        },
        {
          id: 3,
          productId: 30,
          variationId: 300,
          batchNumber: 'B3',
          expiryDate: normalDate,
          quantity: new Decimal(8),
          quantitySold: new Decimal(0),
          quantityAdjusted: new Decimal(0),
          product: { name: 'P3', sku: 'S3' },
          variation: { name: 'V3', subSku: 'S3-V3' },
          purchase: { refNo: 'REF3', locationId: 2 },
        },
      ]);

      const alerts = await service.checkExpiryItems(1, 2);

      expect(alerts).toHaveLength(2);
      expect(alerts[0].alertType).toBe('expired');
      expect(alerts[1].alertType).toBe('expiring_soon');
      expect(alerts[0].remainingQty).toBe(7);
    });
  });

  describe('mapPurchaseSell', () => {
    it('should perform FIFO mapping and allocate sold quantities', async () => {
      prisma.purchaseLine.findMany.mockResolvedValue([
        {
          id: 10,
          quantity: new Decimal(5),
          quantitySold: new Decimal(1),
          quantityAdjusted: new Decimal(0),
          purchase: { purchaseDate: new Date('2026-06-01') },
        },
        {
          id: 20,
          quantity: new Decimal(10),
          quantitySold: new Decimal(0),
          quantityAdjusted: new Decimal(0),
          purchase: { purchaseDate: new Date('2026-06-02') },
        },
      ]);

      prisma.transactionSellLinesPurchaseLines.create.mockImplementation(({ data }) => data);

      const mappings = await service.mapPurchaseSell(100, 1, 6, 1, 2);

      expect(mappings).toHaveLength(2);
      // First batch (ID 10) had 4 remaining (5 - 1 - 0)
      expect(mappings[0]).toEqual({
        sellLineId: 100,
        purchaseLineId: 10,
        quantity: 4,
      });
      // Second batch (ID 20) gets 2
      expect(mappings[1]).toEqual({
        sellLineId: 100,
        purchaseLineId: 20,
        quantity: 2,
      });

      expect(prisma.purchaseLine.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { quantitySold: 5 },
      });
      expect(prisma.purchaseLine.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { quantitySold: 2 },
      });
    });
  });

  describe('markExpired', () => {
    it('should create stock adjustment and deduct remaining quantity', async () => {
      prisma.purchaseLine.findFirst.mockResolvedValue({
        id: 50,
        variationId: 500,
        batchNumber: 'EXP-B',
        quantity: new Decimal(10),
        quantitySold: new Decimal(2),
        quantityAdjusted: new Decimal(1),
        unitCostAfter: new Decimal(15),
        purchase: { locationId: 2 },
      });

      prisma.businessLocation.findFirst.mockResolvedValue({ id: 2 });
      prisma.stockAdjustment.create.mockResolvedValue({
        id: 80,
        referenceNo: 'EXPIRY-ADJ-50-12345',
        note: 'Marked batch EXP-B as expired',
      });

      await service.markExpired(50, 1, 99);

      // Verify StockAdjustment created
      expect(prisma.stockAdjustment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessId: 1,
          createdBy: 99,
          locationId: 2,
          adjustmentType: 'expired',
          totalAmount: 105, // 7 remaining * 15 unit cost
        }),
      });

      // Verify StockAdjustmentLine created
      expect(prisma.stockAdjustmentLine.create).toHaveBeenCalledWith({
        data: {
          adjustmentId: 80,
          variationId: 500,
          quantity: -7,
          unitPrice: new Decimal(15),
          reason: 'expiry',
        },
      });

      // Verify quantityAdjusted incremented on PurchaseLine
      expect(prisma.purchaseLine.update).toHaveBeenCalledWith({
        where: { id: 50 },
        data: { quantityAdjusted: 8 }, // 1 existing + 7 remaining
      });

      // Verify stock level updated
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        500,
        2,
        -7,
        'adjustment',
        expect.stringContaining('EXPIRY-ADJ-50'),
        expect.stringContaining('Marked batch EXP-B as expired'),
        expect.any(Object),
      );
    });

    it('should throw BadRequestException if no remaining stock exists', async () => {
      prisma.purchaseLine.findFirst.mockResolvedValue({
        id: 50,
        variationId: 500,
        batchNumber: 'EXP-B',
        quantity: new Decimal(10),
        quantitySold: new Decimal(8),
        quantityAdjusted: new Decimal(2),
        unitCostAfter: new Decimal(15),
        purchase: { locationId: 2 },
      });

      await expect(service.markExpired(50, 1, 99)).rejects.toThrow(BadRequestException);
    });
  });
});
