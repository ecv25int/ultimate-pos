/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StockAdjustmentsService } from './stock-adjustments.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../inventory/stock.service';
import { PostingService } from '../accounting/posting.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('StockAdjustmentsService', () => {
  let service: StockAdjustmentsService;
  let prisma: any;
  let stockService: any;

  const prismaMock = {
    stockAdjustment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    stockAdjustmentLine: {
      createMany: jest.fn(),
      update: jest.fn(),
    },
    purchaseLine: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    variationLocationDetails: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMock)),
  };

  const stockServiceMock = {
    updateStockLevel: jest.fn(),
    getStockLevel: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockAdjustmentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: StockService, useValue: stockServiceMock },
        {
          provide: PostingService,
          useValue: { postStockAdjustmentToGL: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<StockAdjustmentsService>(StockAdjustmentsService);
    prisma = module.get<PrismaService>(PrismaService);
    stockService = module.get<StockService>(StockService);
  });

  describe('create', () => {
    it('should compute variance if actualQty is provided and update stock if finalised', async () => {
      const dto = {
        locationId: 1,
        adjustmentType: 'inventory_count',
        status: 'received',
        lines: [{ variationId: 10, actualQty: 15, unitPrice: 10 }],
      };

      prisma.variationLocationDetails.findFirst.mockResolvedValue({
        qtyAvailable: new Decimal(10),
      });

      prisma.stockAdjustment.create.mockResolvedValue({ id: 100 });
      prisma.stockAdjustment.findFirst.mockResolvedValue({ id: 100 });

      await service.create(1, 2, dto);

      // Verify system quantity was checked inside transaction
      expect(prisma.variationLocationDetails.findFirst).toHaveBeenCalledWith({
        where: { variationId: 10, locationId: 1 },
      });

      // Verify createMany created line with variance = 15 - 10 = 5
      expect(prisma.stockAdjustmentLine.createMany).toHaveBeenCalledWith({
        data: [
          {
            adjustmentId: 100,
            variationId: 10,
            quantity: 5,
            unitPrice: 10,
            reason: null,
            actualQty: 15,
            systemQty: 10,
          },
        ],
      });

      // Verify stock level updated with the variance quantity (+5)
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        10,
        1,
        5,
        'adjustment',
        'ADJ-100',
        undefined,
        prismaMock,
      );
    });

    it('should NOT update stock level if status is pending', async () => {
      const dto = {
        locationId: 1,
        adjustmentType: 'inventory_count',
        status: 'pending',
        lines: [{ variationId: 10, actualQty: 15, unitPrice: 10 }],
      };

      prisma.variationLocationDetails.findFirst.mockResolvedValue({
        qtyAvailable: new Decimal(10),
      });

      prisma.stockAdjustment.create.mockResolvedValue({ id: 100 });
      prisma.stockAdjustment.findFirst.mockResolvedValue({ id: 100 });

      await service.create(1, 2, dto);

      // Verify stock update skipped
      expect(stockService.updateStockLevel).not.toHaveBeenCalled();
    });

    it('should respect positive / negative reasons when actualQty is not provided', async () => {
      const dto = {
        locationId: 1,
        adjustmentType: 'normal',
        status: 'received',
        lines: [
          { variationId: 10, quantity: 5, unitPrice: 10, reason: 'found' },
          { variationId: 11, quantity: 3, unitPrice: 10, reason: 'damage' },
        ],
      };

      prisma.stockAdjustment.create.mockResolvedValue({ id: 100 });
      prisma.stockAdjustment.findFirst.mockResolvedValue({ id: 100 });

      await service.create(1, 2, dto);

      expect(prisma.stockAdjustmentLine.createMany).toHaveBeenCalledWith({
        data: [
          {
            adjustmentId: 100,
            variationId: 10,
            quantity: 5,
            unitPrice: 10,
            reason: 'found',
            actualQty: null,
            systemQty: null,
          },
          {
            adjustmentId: 100,
            variationId: 11,
            quantity: -3,
            unitPrice: 10,
            reason: 'damage',
            actualQty: null,
            systemQty: null,
          },
        ],
      });
    });
  });

  describe('confirmAdjustment', () => {
    it('should finalize pending adjustment, recalculate variance, and update stock', async () => {
      const mockAdjustment = {
        id: 100,
        businessId: 1,
        locationId: 1,
        finalised: false,
        referenceNo: 'ADJ-100',
        note: 'Count check',
        lines: [
          {
            id: 10,
            variationId: 10,
            quantity: new Decimal(0),
            actualQty: new Decimal(15),
            unitPrice: new Decimal(10),
          },
        ],
      };

      prisma.stockAdjustment.findFirst
        .mockResolvedValueOnce(mockAdjustment) // first query
        .mockResolvedValueOnce({ ...mockAdjustment, finalised: true }); // second query

      prisma.variationLocationDetails.findFirst.mockResolvedValue({
        qtyAvailable: new Decimal(12),
      });

      await service.confirmAdjustment(100, 1);

      // Verify line updated with correct variance: 15 - 12 = 3
      expect(prisma.stockAdjustmentLine.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { systemQty: 12, quantity: 3 },
      });

      // Verify stock level updated by the variance (+3)
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        10,
        1,
        3,
        'adjustment',
        'ADJ-100',
        'Count check',
        prismaMock,
      );

      // Verify status set to received/finalised
      expect(prisma.stockAdjustment.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: expect.objectContaining({
          status: 'received',
          finalised: true,
        }),
      });
    });

    it('should throw BadRequestException if already finalised', async () => {
      prisma.stockAdjustment.findFirst.mockResolvedValue({
        id: 100,
        finalised: true,
      });

      await expect(service.confirmAdjustment(100, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should reverse stock levels on removal if finalised', async () => {
      const mockAdjustment = {
        id: 100,
        locationId: 1,
        finalised: true,
        referenceNo: 'ADJ-100',
        lines: [
          { variationId: 10, quantity: new Decimal(-5) },
          { variationId: 11, quantity: new Decimal(3) },
        ],
      };

      prisma.stockAdjustment.findFirst.mockResolvedValue(mockAdjustment);

      await service.remove(100, 1);

      // Verify rollback updates stock by negating the quantity: -(-5) = 5, and -(3) = -3
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        10,
        1,
        5,
        'adjustment',
        'ADJ-100',
        'Stock adjustment deletion rollback',
        prismaMock,
      );
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        11,
        1,
        -3,
        'adjustment',
        'ADJ-100',
        'Stock adjustment deletion rollback',
        prismaMock,
      );

      expect(prisma.stockAdjustment.delete).toHaveBeenCalledWith({
        where: { id: 100 },
      });
    });

    it('should NOT reverse stock levels on removal if not finalised', async () => {
      const mockAdjustment = {
        id: 100,
        locationId: 1,
        finalised: false,
        referenceNo: 'ADJ-100',
        lines: [{ variationId: 10, quantity: new Decimal(-5) }],
      };

      prisma.stockAdjustment.findFirst.mockResolvedValue(mockAdjustment);

      await service.remove(100, 1);

      expect(stockService.updateStockLevel).not.toHaveBeenCalled();
      expect(prisma.stockAdjustment.delete).toHaveBeenCalledWith({
        where: { id: 100 },
      });
    });
  });
});
