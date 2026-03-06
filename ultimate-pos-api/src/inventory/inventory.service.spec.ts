import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const BUSINESS_ID = 1;
const USER_ID = 10;
const PRODUCT_ID = 5;

const mockProduct = {
  id: PRODUCT_ID,
  businessId: BUSINESS_ID,
  name: 'Widget A',
  sku: 'WGT-001',
  type: 'single',
  enableStock: true,
  alertQuantity: '5.0000',
};

const mockStockEntry = {
  id: 1,
  businessId: BUSINESS_ID,
  productId: PRODUCT_ID,
  entryType: 'purchase',
  quantity: '100.0000',
  unitCost: '10.00',
  referenceNo: 'PO-001',
  note: null,
  createdBy: USER_ID,
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  product: { id: PRODUCT_ID, name: 'Widget A', sku: 'WGT-001' },
};

const mockPrismaService = {
  product: {
    findFirst: jest.fn(),
    findMany:  jest.fn(),
  },
  stockEntry: {
    create:    jest.fn(),
    findFirst: jest.fn(),
    findMany:  jest.fn(),
    count:     jest.fn(),
    delete:    jest.fn(),
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  // ─── createEntry ────────────────────────────────────────────────────────────

  describe('createEntry', () => {
    const dto: CreateStockEntryDto = {
      productId: PRODUCT_ID,
      entryType: 'purchase',
      quantity: 100,
    };

    it('creates a stock entry when product is found and stock-enabled', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.stockEntry.create.mockResolvedValue(mockStockEntry);

      const result = await service.createEntry(USER_ID, BUSINESS_ID, dto);

      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
        where: { id: dto.productId, businessId: BUSINESS_ID },
      });
      expect(mockPrismaService.stockEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ productId: PRODUCT_ID, entryType: 'purchase' }),
        }),
      );
      expect(result).toEqual(mockStockEntry);
    });

    it('throws NotFoundException when product does not belong to business', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.createEntry(USER_ID, BUSINESS_ID, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.stockEntry.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when stock tracking is disabled on product', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        ...mockProduct,
        enableStock: false,
      });

      await expect(service.createEntry(USER_ID, BUSINESS_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── getStockOverview ───────────────────────────────────────────────────────

  describe('getStockOverview', () => {
    it('returns products with correct currentStock and isLowStock flag', async () => {
      const mockProducts = [
        {
          ...mockProduct,
          category: { id: 1, name: 'Electronics' },
          brand:    { id: 1, name: 'Acme' },
          unit:     { id: 1, actualName: 'Piece', shortName: 'PC' },
          stockEntries: [{ quantity: '10.0000' }, { quantity: '20.0000' }], // sum = 30
        },
        {
          ...mockProduct,
          id: 6,
          name: 'Low Stock Widget',
          alertQuantity: '5.0000',
          category: null,
          brand:    null,
          unit:     { id: 1, actualName: 'Piece', shortName: 'PC' },
          stockEntries: [{ quantity: '3.0000' }], // sum = 3 ≤ alertQty 5 → low stock
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getStockOverview(BUSINESS_ID);

      expect(result).toHaveLength(2);
      expect(result[0].currentStock).toBe(30);
      expect(result[0].isLowStock).toBe(false);
      expect(result[1].currentStock).toBe(3);
      expect(result[1].isLowStock).toBe(true);
    });

    it('returns empty array when no stock-enabled products exist', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      const result = await service.getStockOverview(BUSINESS_ID);
      expect(result).toEqual([]);
    });
  });

  // ─── getProductHistory ──────────────────────────────────────────────────────

  describe('getProductHistory', () => {
    it('returns history with accurate running stock sum', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);

      const historyEntries = [
        { ...mockStockEntry, quantity: '50.0000', entryType: 'purchase' },
        { ...mockStockEntry, id: 2, quantity: '-10.0000', entryType: 'sale' },
        { ...mockStockEntry, id: 3, quantity: '5.0000',  entryType: 'adjustment_in' },
      ];
      mockPrismaService.stockEntry.findMany.mockResolvedValue(historyEntries);

      const result = await service.getProductHistory(PRODUCT_ID, BUSINESS_ID);

      // 50 - 10 + 5 = 45
      expect(result.currentStock).toBe(45);
      expect(result.entries).toHaveLength(3);
      expect(result.product.id).toBe(PRODUCT_ID);
    });

    it('throws NotFoundException when product does not belong to business', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.getProductHistory(PRODUCT_ID, BUSINESS_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns 0 currentStock when no stock entries exist', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.stockEntry.findMany.mockResolvedValue([]);

      const result = await service.getProductHistory(PRODUCT_ID, BUSINESS_ID);
      expect(result.currentStock).toBe(0);
      expect(result.entries).toEqual([]);
    });
  });

  // ─── deleteEntry ─────────────────────────────────────────────────────────────

  describe('deleteEntry', () => {
    it('deletes entry and returns success message', async () => {
      mockPrismaService.stockEntry.findFirst.mockResolvedValue(mockStockEntry);
      mockPrismaService.stockEntry.delete.mockResolvedValue(mockStockEntry);

      const result = await service.deleteEntry(1, BUSINESS_ID);

      expect(mockPrismaService.stockEntry.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ message: 'Stock entry deleted' });
    });

    it('throws NotFoundException when entry does not belong to business', async () => {
      mockPrismaService.stockEntry.findFirst.mockResolvedValue(null);

      await expect(service.deleteEntry(99, BUSINESS_ID)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.stockEntry.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getSummary ──────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('categorizes products into adequate, low-stock, and out-of-stock correctly', async () => {
      const mockStockProducts = [
        {
          id: 1, alertQuantity: '5.0000',
          stockEntries: [{ quantity: '30.0000' }], // adequate
        },
        {
          id: 2, alertQuantity: '5.0000',
          stockEntries: [{ quantity: '3.0000' }],  // low stock
        },
        {
          id: 3, alertQuantity: '5.0000',
          stockEntries: [{ quantity: '-5.0000' }, { quantity: '5.0000' }], // sum=0, out of stock
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockStockProducts);
      // Mock stockEntry.findFirst for stock value calculation
      mockPrismaService.stockEntry.findFirst.mockResolvedValue(null);

      const result = await service.getSummary(BUSINESS_ID);

      expect(result.totalProducts).toBe(3);
      expect(result.outOfStockCount).toBe(1);
      expect(result.lowStockCount).toBe(1);
      expect(result.adequateStock).toBe(1);
    });
  });

  // ─── getAdjustments ──────────────────────────────────────────────────────────

  describe('getAdjustments', () => {
    it('returns paginated adjustment entries', async () => {
      const adjustmentEntries = [
        { ...mockStockEntry, entryType: 'adjustment_in', quantity: '10.0000' },
        { ...mockStockEntry, id: 2, entryType: 'adjustment_out', quantity: '-5.0000' },
      ];
      mockPrismaService.stockEntry.findMany.mockResolvedValue(adjustmentEntries);
      mockPrismaService.stockEntry.count.mockResolvedValue(2);

      const result = await service.getAdjustments(BUSINESS_ID, 1, 30);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockPrismaService.stockEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId: BUSINESS_ID,
            entryType: { in: ['adjustment_in', 'adjustment_out'] },
          }),
          skip: 0,
          take: 30,
        }),
      );
    });

    it('filters by productId when provided', async () => {
      mockPrismaService.stockEntry.findMany.mockResolvedValue([]);
      mockPrismaService.stockEntry.count.mockResolvedValue(0);

      await service.getAdjustments(BUSINESS_ID, 1, 30, PRODUCT_ID);

      expect(mockPrismaService.stockEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: PRODUCT_ID }),
        }),
      );
    });
  });
});
