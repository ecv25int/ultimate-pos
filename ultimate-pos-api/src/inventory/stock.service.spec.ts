import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../products/pricing.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('StockService', () => {
  let service: StockService;
  let prisma: any;
  let pricingService: any;

  const prismaMock = {
    variationLocationDetails: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    stockMovement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    variation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    businessLocation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMock)),
  };

  const pricingMock = {
    getPurchasePrice: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PricingService, useValue: pricingMock },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prisma = module.get<PrismaService>(PrismaService);
    pricingService = module.get<PricingService>(PricingService);
  });

  describe('getStockLevel', () => {
    it('should return the qtyAvailable from VariationLocationDetails if it exists', async () => {
      prisma.variationLocationDetails.findFirst.mockResolvedValue({
        qtyAvailable: new Decimal(15),
      });

      const level = await service.getStockLevel(1, 10);
      expect(level).toBe(15);
      expect(prisma.variationLocationDetails.findFirst).toHaveBeenCalledWith({
        where: { variationId: 1, locationId: 10 },
      });
    });

    it('should return 0 if VariationLocationDetails is not found', async () => {
      prisma.variationLocationDetails.findFirst.mockResolvedValue(null);

      const level = await service.getStockLevel(1, 10);
      expect(level).toBe(0);
    });
  });

  describe('getStockHistory', () => {
    it('should return formatted movement logs for a variation at a location', async () => {
      const mockMovements = [
        {
          id: 1,
          createdAt: new Date('2026-06-12T10:00:00Z'),
          type: 'purchase',
          quantity: new Decimal(20),
          referenceNo: 'PO-001',
          note: 'Initial Stock',
          variation: { id: 1, name: 'Red L', subSku: 'SKU-RED-L' },
        },
        {
          id: 2,
          createdAt: new Date('2026-06-12T12:00:00Z'),
          type: 'sale',
          quantity: new Decimal(-5),
          referenceNo: 'SALE-001',
          note: 'POS sale',
          variation: { id: 1, name: 'Red L', subSku: 'SKU-RED-L' },
        },
      ];
      prisma.stockMovement.findMany.mockResolvedValue(mockMovements);

      const history = await service.getStockHistory(1, 10);
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        id: 1,
        date: mockMovements[0].createdAt,
        type: 'purchase',
        quantityChange: 20,
        referenceNo: 'PO-001',
        note: 'Initial Stock',
        variation: { id: 1, name: 'Red L', subSku: 'SKU-RED-L' },
      });
      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith({
        where: { variationId: 1, locationId: 10 },
        orderBy: { createdAt: 'desc' },
        include: { variation: { select: { id: true, name: true, subSku: true } } },
      });
    });
  });

  describe('updateStockLevel', () => {
    const mockVariation = {
      id: 1,
      productId: 5,
      productVariationId: 3,
      product: {
        id: 5,
        businessId: 100,
        enableStock: true,
      },
    };

    it('should throw NotFoundException if variation does not exist', async () => {
      prisma.variation.findUnique.mockResolvedValue(null);

      await expect(service.updateStockLevel(99, 10, 5, 'purchase')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should do nothing if stock tracking is disabled for the product', async () => {
      prisma.variation.findUnique.mockResolvedValue({
        ...mockVariation,
        product: { ...mockVariation.product, enableStock: false },
      });

      await service.updateStockLevel(1, 10, 5, 'purchase');
      expect(prisma.variationLocationDetails.findFirst).not.toHaveBeenCalled();
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });

    it('should create new VariationLocationDetails record if none exists', async () => {
      prisma.variation.findUnique.mockResolvedValue(mockVariation);
      prisma.variationLocationDetails.findFirst.mockResolvedValue(null);

      await service.updateStockLevel(1, 10, 15, 'purchase', 'REF-1', 'Note 1');

      expect(prisma.variationLocationDetails.create).toHaveBeenCalledWith({
        data: {
          productId: 5,
          productVariationId: 3,
          variationId: 1,
          locationId: 10,
          qtyAvailable: 15,
        },
      });

      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: {
          businessId: 100,
          variationId: 1,
          locationId: 10,
          type: 'purchase',
          quantity: 15,
          referenceNo: 'REF-1',
          note: 'Note 1',
        },
      });
    });

    it('should update existing VariationLocationDetails quantity if it already exists', async () => {
      prisma.variation.findUnique.mockResolvedValue(mockVariation);
      prisma.variationLocationDetails.findFirst.mockResolvedValue({
        id: 50,
        qtyAvailable: new Decimal(20),
      });

      await service.updateStockLevel(1, 10, -5, 'sale', 'REF-2', 'Note 2');

      expect(prisma.variationLocationDetails.update).toHaveBeenCalledWith({
        where: { id: 50 },
        data: { qtyAvailable: 15 },
      });

      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: {
          businessId: 100,
          variationId: 1,
          locationId: 10,
          type: 'sale',
          quantity: -5,
          referenceNo: 'REF-2',
          note: 'Note 2',
        },
      });
    });
  });

  describe('checkStockAvailability', () => {
    it('should return true if stock is greater than or equal to requested quantity', async () => {
      prisma.variationLocationDetails.findFirst.mockResolvedValue({
        qtyAvailable: new Decimal(10),
      });
      const result = await service.checkStockAvailability(1, 10, 8);
      expect(result).toBe(true);
    });

    it('should return false if stock is less than requested quantity', async () => {
      prisma.variationLocationDetails.findFirst.mockResolvedValue({
        qtyAvailable: new Decimal(10),
      });
      const result = await service.checkStockAvailability(1, 10, 12);
      expect(result).toBe(false);
    });
  });

  describe('getStockValuation', () => {
    it('should sum value for variations using purchase price', async () => {
      const mockDetails = [
        {
          variationId: 1,
          locationId: 10,
          qtyAvailable: new Decimal(10),
          location: { id: 10, name: 'Warehouse A' },
          variation: { id: 1, name: 'V1', defaultPurchasePrice: new Decimal(5) },
        },
        {
          variationId: 2,
          locationId: 10,
          qtyAvailable: new Decimal(5),
          location: { id: 10, name: 'Warehouse A' },
          variation: { id: 2, name: 'V2', defaultPurchasePrice: new Decimal(20) },
        },
      ];

      prisma.variationLocationDetails.findMany.mockResolvedValue(mockDetails);
      pricingService.getPurchasePrice.mockImplementation((id) => {
        return id === 1 ? 5 : 20;
      });

      const valuation = await service.getStockValuation(100, 10);
      // 10 * 5 = 50, 5 * 20 = 100 => total 150
      expect(valuation.totalValuation).toBe(150);
      expect(valuation.locationValuations).toHaveLength(1);
      expect(valuation.locationValuations[0]).toEqual({
        locationId: 10,
        name: 'Warehouse A',
        valuation: 150,
      });
    });
  });

  describe('getStockAlerts', () => {
    it('should return items where current stock <= alertQuantity', async () => {
      const mockDetails = [
        {
          variationId: 1,
          productId: 5,
          locationId: 10,
          qtyAvailable: new Decimal(3),
          location: { id: 10, name: 'Warehouse A' },
          variation: {
            id: 1,
            name: 'V1',
            product: { id: 5, name: 'Product A', alertQuantity: new Decimal(5), sku: 'SKU-A' },
          },
        },
        {
          variationId: 2,
          productId: 6,
          locationId: 10,
          qtyAvailable: new Decimal(10),
          location: { id: 10, name: 'Warehouse A' },
          variation: {
            id: 2,
            name: 'V2',
            product: { id: 6, name: 'Product B', alertQuantity: new Decimal(5), sku: 'SKU-B' },
          },
        },
      ];

      prisma.variationLocationDetails.findMany.mockResolvedValue(mockDetails);

      const alerts = await service.getStockAlerts(100, 10);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toEqual({
        variationId: 1,
        productId: 5,
        productName: 'Product A',
        variationName: 'V1',
        sku: 'SKU-A',
        locationId: 10,
        locationName: 'Warehouse A',
        currentStock: 3,
        alertQuantity: 5,
        isLowStock: true,
      });
    });
  });

  describe('getLocationStock', () => {
    it('should throw NotFoundException if location is not found', async () => {
      prisma.businessLocation.findFirst.mockResolvedValue(null);

      await expect(service.getLocationStock(100, 99)).rejects.toThrow(NotFoundException);
    });

    it('should return list of stock details at location', async () => {
      prisma.businessLocation.findFirst.mockResolvedValue({ id: 10, name: 'Warehouse A' });
      const mockDetails = [
        {
          variationId: 1,
          productId: 5,
          locationId: 10,
          qtyAvailable: new Decimal(20),
          variation: {
            id: 1,
            name: 'V1',
            product: { id: 5, name: 'Product A', alertQuantity: new Decimal(5), sku: 'SKU-A' },
          },
        },
      ];
      prisma.variationLocationDetails.findMany.mockResolvedValue(mockDetails);

      const stock = await service.getLocationStock(100, 10);
      expect(stock).toHaveLength(1);
      expect(stock[0]).toEqual({
        variationId: 1,
        productId: 5,
        productName: 'Product A',
        variationName: 'V1',
        sku: 'SKU-A',
        qtyAvailable: 20,
        alertQuantity: 5,
        isLowStock: false,
      });
    });
  });
});
