import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VariationsService } from './variations.service';
import { PrismaService } from '../prisma/prisma.service';

const BUSINESS_ID = 1;
const PRODUCT_ID = 10;
const TEMPLATE_ID = 5;
const VALUE_TEMPLATE_ID = 15;
const PRODUCT_VAR_ID = 20;
const VARIATION_ID = 30;

const mockPrismaService = {
  variationTemplate: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  variationValueTemplate: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  productVariation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  variation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('VariationsService', () => {
  let service: VariationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariationsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<VariationsService>(VariationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Variation Templates ───────────────────────────────────────────────────

  describe('Variation Templates', () => {
    const dto = { name: 'Size' };

    it('creates a variation template', async () => {
      const mockResult = {
        id: TEMPLATE_ID,
        businessId: BUSINESS_ID,
        name: 'Size',
        variationValues: [],
      };
      mockPrismaService.variationTemplate.create.mockResolvedValue(mockResult);

      const result = await service.createTemplate(BUSINESS_ID, dto);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.variationTemplate.create).toHaveBeenCalledWith({
        data: { businessId: BUSINESS_ID, name: dto.name },
        include: { variationValues: true },
      });
    });

    it('finds all templates for a business', async () => {
      const mockList = [
        { id: TEMPLATE_ID, businessId: BUSINESS_ID, name: 'Size', variationValues: [] },
      ];
      mockPrismaService.variationTemplate.findMany.mockResolvedValue(mockList);

      const result = await service.findAllTemplates(BUSINESS_ID);
      expect(result).toEqual(mockList);
      expect(mockPrismaService.variationTemplate.findMany).toHaveBeenCalledWith({
        where: { businessId: BUSINESS_ID },
        include: { variationValues: true },
        orderBy: { name: 'asc' },
      });
    });

    it('finds one template', async () => {
      const mockResult = {
        id: TEMPLATE_ID,
        businessId: BUSINESS_ID,
        name: 'Size',
        variationValues: [],
      };
      mockPrismaService.variationTemplate.findFirst.mockResolvedValue(mockResult);

      const result = await service.findOneTemplate(TEMPLATE_ID, BUSINESS_ID);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.variationTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: TEMPLATE_ID, businessId: BUSINESS_ID },
        include: { variationValues: true },
      });
    });

    it('throws NotFoundException if template not found', async () => {
      mockPrismaService.variationTemplate.findFirst.mockResolvedValue(null);

      await expect(service.findOneTemplate(999, BUSINESS_ID)).rejects.toThrow(NotFoundException);
    });

    it('updates a template', async () => {
      const mockResult = {
        id: TEMPLATE_ID,
        businessId: BUSINESS_ID,
        name: 'Size',
        variationValues: [],
      };
      mockPrismaService.variationTemplate.findFirst.mockResolvedValue(mockResult);
      mockPrismaService.variationTemplate.update.mockResolvedValue({
        ...mockResult,
        name: 'New Size',
      });

      const result = await service.updateTemplate(TEMPLATE_ID, BUSINESS_ID, { name: 'New Size' });
      expect(result.name).toBe('New Size');
      expect(mockPrismaService.variationTemplate.update).toHaveBeenCalledWith({
        where: { id: TEMPLATE_ID },
        data: { name: 'New Size' },
      });
    });

    it('removes a template', async () => {
      const mockResult = {
        id: TEMPLATE_ID,
        businessId: BUSINESS_ID,
        name: 'Size',
        variationValues: [],
      };
      mockPrismaService.variationTemplate.findFirst.mockResolvedValue(mockResult);
      mockPrismaService.variationTemplate.delete.mockResolvedValue(mockResult);

      const result = await service.removeTemplate(TEMPLATE_ID, BUSINESS_ID);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.variationTemplate.delete).toHaveBeenCalledWith({
        where: { id: TEMPLATE_ID },
      });
    });
  });

  // ─── Variation Value Templates ─────────────────────────────────────────────

  describe('Variation Value Templates', () => {
    it('creates a value template', async () => {
      const dto = { variationTemplateId: TEMPLATE_ID, name: 'Large' };
      const mockResult = { id: VALUE_TEMPLATE_ID, variationTemplateId: TEMPLATE_ID, name: 'Large' };
      mockPrismaService.variationValueTemplate.create.mockResolvedValue(mockResult);

      const result = await service.createValueTemplate(BUSINESS_ID, dto);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.variationValueTemplate.create).toHaveBeenCalledWith({
        data: { variationTemplateId: dto.variationTemplateId, name: dto.name },
      });
    });

    it('removes a value template', async () => {
      const mockResult = { id: VALUE_TEMPLATE_ID, variationTemplateId: TEMPLATE_ID, name: 'Large' };
      mockPrismaService.variationValueTemplate.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.variationValueTemplate.delete.mockResolvedValue(mockResult);

      const result = await service.removeValueTemplate(VALUE_TEMPLATE_ID);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.variationValueTemplate.delete).toHaveBeenCalledWith({
        where: { id: VALUE_TEMPLATE_ID },
      });
    });

    it('throws NotFoundException when removing a non-existent value template', async () => {
      mockPrismaService.variationValueTemplate.findUnique.mockResolvedValue(null);

      await expect(service.removeValueTemplate(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Product Variations ────────────────────────────────────────────────────

  describe('Product Variations', () => {
    const dto = { productId: PRODUCT_ID, name: 'Color', isDummy: false };

    it('creates a product variation', async () => {
      const mockResult = {
        id: PRODUCT_VAR_ID,
        productId: PRODUCT_ID,
        name: 'Color',
        isDummy: false,
        variations: [],
      };
      mockPrismaService.productVariation.create.mockResolvedValue(mockResult);

      const result = await service.createProductVariation(dto);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.productVariation.create).toHaveBeenCalledWith({
        data: {
          productId: dto.productId,
          name: dto.name,
          isDummy: dto.isDummy,
        },
        include: { variations: true },
      });
    });

    it('finds product variations by product id', async () => {
      const mockList = [
        {
          id: PRODUCT_VAR_ID,
          productId: PRODUCT_ID,
          name: 'Color',
          isDummy: false,
          variations: [],
        },
      ];
      mockPrismaService.productVariation.findMany.mockResolvedValue(mockList);

      const result = await service.findProductVariations(PRODUCT_ID);
      expect(result).toEqual(mockList);
      expect(mockPrismaService.productVariation.findMany).toHaveBeenCalledWith({
        where: { productId: PRODUCT_ID },
        include: { variations: true },
      });
    });

    it('removes a product variation', async () => {
      const mockResult = {
        id: PRODUCT_VAR_ID,
        productId: PRODUCT_ID,
        name: 'Color',
        isDummy: false,
      };
      mockPrismaService.productVariation.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.productVariation.delete.mockResolvedValue(mockResult);

      const result = await service.removeProductVariation(PRODUCT_VAR_ID);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.productVariation.delete).toHaveBeenCalledWith({
        where: { id: PRODUCT_VAR_ID },
      });
    });

    it('throws NotFoundException when removing non-existent product variation', async () => {
      mockPrismaService.productVariation.findUnique.mockResolvedValue(null);

      await expect(service.removeProductVariation(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Variations ────────────────────────────────────────────────────────────

  describe('Variations', () => {
    const dto = {
      productId: PRODUCT_ID,
      productVariationId: PRODUCT_VAR_ID,
      name: 'Red',
      subSku: 'RED001',
      defaultPurchasePrice: 10,
      dppIncTax: 12,
      profitPercent: 25,
      defaultSellPrice: 15,
      sellPriceIncTax: 18,
    };

    it('creates a variation', async () => {
      const mockResult = { id: VARIATION_ID, ...dto };
      mockPrismaService.variation.create.mockResolvedValue(mockResult);

      const result = await service.createVariation(dto);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.variation.create).toHaveBeenCalledWith({
        data: {
          productId: dto.productId,
          productVariationId: dto.productVariationId,
          name: dto.name,
          subSku: dto.subSku,
          defaultPurchasePrice: dto.defaultPurchasePrice,
          dppIncTax: dto.dppIncTax,
          profitPercent: dto.profitPercent,
          defaultSellPrice: dto.defaultSellPrice,
          sellPriceIncTax: dto.sellPriceIncTax,
        },
      });
    });

    it('finds variations by product id', async () => {
      const mockList = [{ id: VARIATION_ID, ...dto, deletedAt: null }];
      mockPrismaService.variation.findMany.mockResolvedValue(mockList);

      const result = await service.findVariationsByProduct(PRODUCT_ID);
      expect(result).toEqual(mockList);
      expect(mockPrismaService.variation.findMany).toHaveBeenCalledWith({
        where: { productId: PRODUCT_ID, deletedAt: null },
        include: { productVariation: true, groupPrices: true, locationDetails: true },
      });
    });

    it('finds one variation by id', async () => {
      const mockResult = { id: VARIATION_ID, ...dto, deletedAt: null };
      mockPrismaService.variation.findFirst.mockResolvedValue(mockResult);

      const result = await service.findOneVariation(VARIATION_ID);
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.variation.findFirst).toHaveBeenCalledWith({
        where: { id: VARIATION_ID, deletedAt: null },
        include: { productVariation: true, groupPrices: true, locationDetails: true },
      });
    });

    it('throws NotFoundException if variation not found', async () => {
      mockPrismaService.variation.findFirst.mockResolvedValue(null);

      await expect(service.findOneVariation(999)).rejects.toThrow(NotFoundException);
    });

    it('updates a variation', async () => {
      const mockResult = { id: VARIATION_ID, ...dto, deletedAt: null };
      mockPrismaService.variation.findFirst.mockResolvedValue(mockResult);
      mockPrismaService.variation.update.mockResolvedValue({ ...mockResult, name: 'Crimson' });

      const result = await service.updateVariation(VARIATION_ID, { name: 'Crimson' });
      expect(result.name).toBe('Crimson');
      expect(mockPrismaService.variation.update).toHaveBeenCalledWith({
        where: { id: VARIATION_ID },
        data: { name: 'Crimson' },
      });
    });

    it('removes a variation (soft-delete)', async () => {
      const mockResult = { id: VARIATION_ID, ...dto, deletedAt: null };
      mockPrismaService.variation.findFirst.mockResolvedValue(mockResult);
      mockPrismaService.variation.update.mockResolvedValue({
        ...mockResult,
        deletedAt: new Date(),
      });

      const result = await service.removeVariation(VARIATION_ID);
      expect(result.deletedAt).toBeDefined();
      expect(mockPrismaService.variation.update).toHaveBeenCalledWith({
        where: { id: VARIATION_ID },
        data: { deletedAt: expect.any(Date) as unknown },
      });
    });
  });
});
