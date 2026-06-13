import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';

const BUSINESS_ID = 1;
const PRODUCT_ID = 10;
const VARIATION_ID = 30;
const SELLING_GROUP_ID = 5;
const CUSTOMER_GROUP_ID = 8;

const mockPrismaService = {
  variation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  customerGroup: {
    findUnique: jest.fn(),
  },
  variationGroupPrice: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<PricingService>(PricingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getPurchasePrice ───────────────────────────────────────────────────────

  describe('getPurchasePrice', () => {
    it('returns defaultPurchasePrice for a single/variable product variation', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultPurchasePrice: 150.0,
        product: { type: 'single' },
        mfgRecipes: [],
      });

      const price = await service.getPurchasePrice(VARIATION_ID);
      expect(price).toBe(150.0);
    });

    it('returns recipe cost for a combo product variation if recipe exists', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultPurchasePrice: 150.0,
        product: { type: 'combo' },
        mfgRecipes: [
          {
            ingredientsCost: 120.0,
            extraCost: 15.0,
          },
        ],
      });

      const price = await service.getPurchasePrice(VARIATION_ID);
      expect(price).toBe(135.0); // 120 + 15
    });

    it('returns defaultPurchasePrice for a combo product variation if no recipe exists', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultPurchasePrice: 150.0,
        product: { type: 'combo' },
        mfgRecipes: [],
      });

      const price = await service.getPurchasePrice(VARIATION_ID);
      expect(price).toBe(150.0);
    });

    it('throws NotFoundException if variation is not found', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue(null);

      await expect(service.getPurchasePrice(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getSellingPrice ───────────────────────────────────────────────────────

  describe('getSellingPrice', () => {
    it('returns original selling prices if no overrides are specified', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultSellPrice: 100.0,
        sellPriceIncTax: 110.0, // 10% tax rate
      });

      const result = await service.getSellingPrice(VARIATION_ID);
      expect(result).toEqual({
        defaultSellPrice: 100.0,
        sellPriceIncTax: 110.0,
      });
    });

    it('applies selling price group override correctly', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultSellPrice: 100.0,
        sellPriceIncTax: 110.0, // 10% tax rate
      });
      mockPrismaService.variationGroupPrice.findFirst.mockResolvedValue({
        priceIncTax: 220.0,
      });

      const result = await service.getSellingPrice(VARIATION_ID, undefined, SELLING_GROUP_ID);
      expect(result).toEqual({
        sellPriceIncTax: 220.0,
        defaultSellPrice: 200.0, // 220 / (1 + 10%)
      });
    });

    it('applies customer group percentage adjustment correctly (markup)', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultSellPrice: 100.0,
        sellPriceIncTax: 110.0,
      });
      mockPrismaService.customerGroup.findUnique.mockResolvedValue({
        amount: 5.0, // +5% markup
      });

      const result = await service.getSellingPrice(VARIATION_ID, CUSTOMER_GROUP_ID);
      expect(result).toEqual({
        defaultSellPrice: 105.0, // 100 + 5%
        sellPriceIncTax: 115.5, // 110 + 5%
      });
    });

    it('applies customer group percentage adjustment correctly (discount)', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultSellPrice: 100.0,
        sellPriceIncTax: 110.0,
      });
      mockPrismaService.customerGroup.findUnique.mockResolvedValue({
        amount: -10.0, // -10% discount
      });

      const result = await service.getSellingPrice(VARIATION_ID, CUSTOMER_GROUP_ID);
      expect(result).toEqual({
        defaultSellPrice: 90.0, // 100 - 10%
        sellPriceIncTax: 99.0, // 110 - 10%
      });
    });

    it('applies selling price group override first, then customer group discount', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultSellPrice: 100.0,
        sellPriceIncTax: 110.0, // 10% tax rate
      });
      mockPrismaService.variationGroupPrice.findFirst.mockResolvedValue({
        priceIncTax: 220.0,
      });
      mockPrismaService.customerGroup.findUnique.mockResolvedValue({
        amount: -10.0, // -10% discount
      });

      const result = await service.getSellingPrice(
        VARIATION_ID,
        CUSTOMER_GROUP_ID,
        SELLING_GROUP_ID,
      );
      expect(result).toEqual({
        defaultSellPrice: 180.0, // 200 - 10%
        sellPriceIncTax: 198.0, // 220 - 10%
      });
    });
  });

  // ─── getProfitMargin ───────────────────────────────────────────────────────

  describe('getProfitMargin', () => {
    it('calculates the profit margin percentage correctly', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultPurchasePrice: 80.0,
        defaultSellPrice: 100.0,
        sellPriceIncTax: 100.0,
        product: { type: 'single' },
        mfgRecipes: [],
      });

      const margin = await service.getProfitMargin(VARIATION_ID);
      expect(margin).toBe(25.0); // ((100 - 80) / 80) * 100
    });

    it('returns 0 if purchase price is 0', async () => {
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultPurchasePrice: 0.0,
        defaultSellPrice: 100.0,
        sellPriceIncTax: 100.0,
        product: { type: 'single' },
        mfgRecipes: [],
      });

      const margin = await service.getProfitMargin(VARIATION_ID);
      expect(margin).toBe(0.0);
    });
  });

  // ─── getProductPricingDetails ──────────────────────────────────────────────

  describe('getProductPricingDetails', () => {
    it('returns aggregated details for product variations', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        id: PRODUCT_ID,
        name: 'Super Gadget',
        type: 'variable',
      });
      mockPrismaService.variation.findMany.mockResolvedValue([
        {
          id: VARIATION_ID,
          name: 'Gadget Blue',
          subSku: 'GADG-BL',
          defaultPurchasePrice: 50.0,
          defaultSellPrice: 80.0,
          sellPriceIncTax: 88.0,
          productVariation: { name: 'Color' },
          product: { type: 'variable' },
          mfgRecipes: [],
        },
      ]);
      mockPrismaService.variation.findUnique.mockResolvedValue({
        id: VARIATION_ID,
        defaultPurchasePrice: 50.0,
        defaultSellPrice: 80.0,
        sellPriceIncTax: 88.0,
        product: { type: 'variable' },
        mfgRecipes: [],
      });

      const details = await service.getProductPricingDetails(PRODUCT_ID, BUSINESS_ID);
      expect(details.productId).toBe(PRODUCT_ID);
      expect(details.variations).toHaveLength(1);
      expect(details.variations[0].profitMargin).toBe(60.0); // ((80-50)/50)*100
    });
  });

  // ─── setGroupPrices ────────────────────────────────────────────────────────

  describe('setGroupPrices', () => {
    const dto = {
      groupPrices: [
        {
          variationId: VARIATION_ID,
          priceGroupId: SELLING_GROUP_ID,
          priceIncTax: 99.9,
        },
      ],
    };

    it('updates existing overrides successfully in a transaction', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: PRODUCT_ID });
      mockPrismaService.variation.findMany.mockResolvedValue([{ id: VARIATION_ID }]);

      const mockTx = {
        variationGroupPrice: {
          findFirst: jest.fn().mockResolvedValue({ id: 100 }),
          update: jest.fn().mockResolvedValue({ id: 100, priceIncTax: 99.9 }),
          create: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
        callback(mockTx),
      );

      const result = await service.setGroupPrices(PRODUCT_ID, BUSINESS_ID, dto);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(mockTx.variationGroupPrice.update).toHaveBeenCalled();
    });

    it('creates new overrides successfully in a transaction', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: PRODUCT_ID });
      mockPrismaService.variation.findMany.mockResolvedValue([{ id: VARIATION_ID }]);

      const mockTx = {
        variationGroupPrice: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
          create: jest.fn().mockResolvedValue({ id: 101, priceIncTax: 99.9 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
        callback(mockTx),
      );

      const result = await service.setGroupPrices(PRODUCT_ID, BUSINESS_ID, dto);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(mockTx.variationGroupPrice.create).toHaveBeenCalled();
    });

    it('throws BadRequestException if variation does not belong to product', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: PRODUCT_ID });
      mockPrismaService.variation.findMany.mockResolvedValue([{ id: 111 }]); // variation list has different id

      await expect(service.setGroupPrices(PRODUCT_ID, BUSINESS_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
