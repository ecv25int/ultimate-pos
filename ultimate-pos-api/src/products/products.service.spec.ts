import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

const BUSINESS_ID = 1;
const USER_ID = 1;

const mockProduct = {
  id: 1,
  name: 'Test Product',
  type: 'single',
  unitId: 1,
  brandId: 1,
  categoryId: 1,
  subCategoryId: null,
  sku: 'TEST0001',
  barcodeType: 'C128',
  enableStock: false,
  alertQuantity: 0,
  businessId: BUSINESS_ID,
  createdBy: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  unit: { id: 1, actualName: 'Pieces', shortName: 'Pcs' },
  brand: { id: 1, name: 'Brand A' },
  category: { id: 1, name: 'Category X' },
  subCategory: null,
};

const mockBusiness = {
  id: BUSINESS_ID,
  name: 'Awesome Shop',
};

const mockPrismaService = {
  unit: {
    findFirst: jest.fn(),
  },
  brand: {
    findFirst: jest.fn(),
  },
  category: {
    findFirst: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  business: {
    findUnique: jest.fn(),
  },
  variation: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  stockEntry: {
    groupBy: jest.fn(),
  },
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      name: 'New Product',
      type: 'single',
      unitId: 1,
      brandId: 1,
      categoryId: 1,
      sku: 'NEW0001',
      barcodeType: 'C128',
      enableStock: false,
      alertQuantity: 0,
    };

    it('creates a product with manual SKU successfully', async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.brand.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.product.findFirst.mockResolvedValue(null); // SKU doesn't exist
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(USER_ID, BUSINESS_ID, createDto);

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sku: 'NEW0001',
          }) as unknown,
        }) as unknown,
      );
    });

    it('creates a product with auto-generated SKU successfully', async () => {
      const autoDto = { ...createDto, sku: undefined };
      mockPrismaService.unit.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.brand.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrismaService.product.findFirst
        .mockResolvedValueOnce(null) // next sequential query
        .mockResolvedValueOnce(null); // uniqueness check
      mockPrismaService.product.create.mockResolvedValue({ ...mockProduct, sku: 'AWE0001' });

      const result = await service.create(USER_ID, BUSINESS_ID, autoDto);

      expect(result.sku).toBe('AWE0001');
      expect(mockPrismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sku: 'AWE0001', // 'Awesome Shop' -> AWE + 0001
          }) as unknown,
        }) as unknown,
      );
    });

    it('throws BadRequestException if manual SKU already exists', async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.brand.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 2, sku: 'NEW0001' });

      await expect(service.create(USER_ID, BUSINESS_ID, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if unit not found', async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue(null);

      await expect(service.create(USER_ID, BUSINESS_ID, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if brand not found', async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.brand.findFirst.mockResolvedValue(null);

      await expect(service.create(USER_ID, BUSINESS_ID, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if category not found', async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.brand.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      await expect(service.create(USER_ID, BUSINESS_ID, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a product by ID', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.findOne(1, BUSINESS_ID);
      expect(result).toEqual(mockProduct);
    });

    it('throws NotFoundException if product is not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999, BUSINESS_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all products for business (cached or fresh)', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findAll(BUSINESS_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProduct);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const updateDto = {
      name: 'Updated Product Name',
      sku: 'UPDATED01',
    };

    it('updates product successfully', async () => {
      mockPrismaService.product.findFirst
        .mockResolvedValueOnce(mockProduct) // existing product check
        .mockResolvedValueOnce(null); // new SKU uniqueness check
      mockPrismaService.product.update.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await service.update(1, BUSINESS_ID, updateDto);

      expect(result.name).toBe('Updated Product Name');
      expect(result.sku).toBe('UPDATED01');
    });

    it('throws NotFoundException if product to update not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.update(999, BUSINESS_ID, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if SKU already exists on other product', async () => {
      mockPrismaService.product.findFirst
        .mockResolvedValueOnce(mockProduct) // existing product check
        .mockResolvedValueOnce({ id: 2, sku: 'UPDATED01' }); // other product has this SKU

      await expect(service.update(1, BUSINESS_ID, updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes product successfully', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove(1, BUSINESS_ID);
      expect(result.message).toContain('success');
    });

    it('throws NotFoundException if product to delete not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.remove(999, BUSINESS_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── bulkUpdatePrices ───────────────────────────────────────────────────────

  describe('bulkUpdatePrices', () => {
    it('updates prices of variations successfully', async () => {
      mockPrismaService.variation.findFirst.mockResolvedValue({ id: 10, productId: 1 });
      mockPrismaService.variation.update.mockResolvedValue({ id: 10, defaultSellPrice: 150 });

      const result = await service.bulkUpdatePrices(BUSINESS_ID, [
        { variationId: 10, defaultSellPrice: 150 },
      ]);

      expect(result.updated).toBe(1);
    });
  });
});
