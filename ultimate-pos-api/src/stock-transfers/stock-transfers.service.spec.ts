/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StockTransfersService } from './stock-transfers.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../inventory/stock.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('StockTransfersService', () => {
  let service: StockTransfersService;
  let prisma: any;
  let stockService: any;

  const prismaMock = {
    stockTransfer: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    stockEntry: {
      create: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
    variation: {
      findFirst: jest.fn(),
    },
    businessLocation: {
      findFirst: jest.fn(),
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
        StockTransfersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: StockService, useValue: stockServiceMock },
      ],
    }).compile();

    service = module.get<StockTransfersService>(StockTransfersService);
    prisma = module.get<PrismaService>(PrismaService);
    stockService = module.get<StockService>(StockService);
  });

  describe('create', () => {
    it('should create multiple transfers in bulk under the same referenceNo', async () => {
      const dto = {
        fromLocation: 'Warehouse A',
        toLocation: 'Store B',
        status: 'pending' as const,
        items: [
          { productId: 10, quantity: 5 },
          { productId: 11, quantity: 8 },
        ],
      };

      prisma.product.findFirst.mockResolvedValue({ id: 1 });
      prisma.stockTransfer.create.mockImplementation(({ data }) => ({
        id: Math.floor(Math.random() * 1000),
        ...data,
      }));

      const results = await service.create(1, 2, dto);

      expect(results).toHaveLength(2);
      expect(results[0].referenceNo).toEqual(results[1].referenceNo);
      expect(results[0].status).toBe('pending');

      // Verify stock level was NOT updated since status is pending
      expect(stockService.updateStockLevel).not.toHaveBeenCalled();
    });

    it('should update stock levels immediately if status is completed', async () => {
      const dto = {
        fromLocation: 'Warehouse A',
        toLocation: 'Store B',
        status: 'completed' as const,
        items: [{ productId: 10, quantity: 5 }],
      };

      prisma.product.findFirst.mockResolvedValue({ id: 1 });
      prisma.stockTransfer.create.mockResolvedValue({
        id: 100,
        status: 'completed',
        productId: 10,
        quantity: 5,
        fromLocation: 'Warehouse A',
        toLocation: 'Store B',
      });

      prisma.variation.findFirst.mockResolvedValue({ id: 20 });
      prisma.businessLocation.findFirst.mockImplementation(({ where }) => {
        if (where.name === 'Warehouse A') return { id: 1 };
        if (where.name === 'Store B') return { id: 2 };
        return null;
      });

      await service.create(1, 2, dto);

      // Verify stock entries and stock updates
      expect(prisma.stockEntry.create).toHaveBeenCalledTimes(2);
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        20,
        1,
        -5,
        'transfer',
        expect.any(String),
        'Transfer out to Store B',
        prismaMock,
      );
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        20,
        2,
        5,
        'transfer',
        expect.any(String),
        'Transfer in from Warehouse A',
        prismaMock,
      );
    });
  });

  describe('receiveTransfer', () => {
    it('should transition status to received, deduct full quantity from source, and add receivedQty to target', async () => {
      const mockTransfer = {
        id: 100,
        businessId: 1,
        productId: 10,
        quantity: new Decimal(10),
        fromLocation: 'Warehouse A',
        toLocation: 'Store B',
        status: 'pending',
        referenceNo: 'TRF-100',
        createdBy: 2,
      };

      prisma.stockTransfer.findFirst.mockResolvedValue(mockTransfer);
      prisma.stockTransfer.update.mockResolvedValue({ ...mockTransfer, status: 'received' });
      prisma.variation.findFirst.mockResolvedValue({ id: 20 });
      prisma.businessLocation.findFirst.mockImplementation(({ where }) => {
        if (where.name === 'Warehouse A') return { id: 1 };
        if (where.name === 'Store B') return { id: 2 };
        return null;
      });

      // Receive 8 items instead of the full 10
      const result = await service.receiveTransfer(100, 1, 8);

      expect(result.status).toBe('received');

      // Verify stock entry out has -10 and stock entry in has 8
      expect(prisma.stockEntry.create).toHaveBeenCalledWith({
        data: {
          businessId: 1,
          productId: 10,
          entryType: 'transfer_out',
          quantity: -10,
          referenceNo: 'TRF-100',
          note: 'Transfer out to Store B',
          createdBy: 2,
        },
      });
      expect(prisma.stockEntry.create).toHaveBeenCalledWith({
        data: {
          businessId: 1,
          productId: 10,
          entryType: 'transfer_in',
          quantity: 8,
          referenceNo: 'TRF-100',
          note: 'Transfer in from Warehouse A',
          createdBy: 2,
        },
      });

      // Verify stock service updates: deduct 10 from source, add 8 to target
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        20,
        1,
        -10,
        'transfer',
        'TRF-100',
        'Transfer out to Store B',
        prismaMock,
      );
      expect(stockService.updateStockLevel).toHaveBeenCalledWith(
        20,
        2,
        8,
        'transfer',
        'TRF-100',
        'Transfer in from Warehouse A',
        prismaMock,
      );
    });

    it('should throw BadRequestException if trying to receive more than transferred', async () => {
      const mockTransfer = {
        id: 100,
        businessId: 1,
        productId: 10,
        quantity: new Decimal(10),
        status: 'pending',
      };
      prisma.stockTransfer.findFirst.mockResolvedValue(mockTransfer);

      await expect(service.receiveTransfer(100, 1, 12)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transfer is not pending', async () => {
      const mockTransfer = {
        id: 100,
        businessId: 1,
        productId: 10,
        quantity: new Decimal(10),
        status: 'completed',
      };
      prisma.stockTransfer.findFirst.mockResolvedValue(mockTransfer);

      await expect(service.receiveTransfer(100, 1, 5)).rejects.toThrow(BadRequestException);
    });
  });
});
