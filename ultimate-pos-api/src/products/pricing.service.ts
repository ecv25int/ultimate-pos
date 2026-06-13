import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetGroupPricesDto } from './dto/set-group-prices.dto';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolves the purchase price / production cost of a variation.
   * If the product is a combo product, it checks the MfgRecipe table
   * to calculate the total ingredient and production extra costs.
   */
  async getPurchasePrice(variationId: number): Promise<number> {
    const variation = await this.prisma.variation.findUnique({
      where: { id: variationId },
      include: {
        product: true,
        mfgRecipes: {
          take: 1,
        },
      },
    });

    if (!variation) {
      throw new NotFoundException('Variation not found');
    }

    if (variation.product.type === 'combo') {
      const recipe = variation.mfgRecipes[0];
      if (recipe) {
        return Number(recipe.ingredientsCost ?? 0) + Number(recipe.extraCost ?? 0);
      }
    }

    return Number(variation.defaultPurchasePrice ?? 0);
  }

  /**
   * Computes the final selling price for a variation.
   * Resolves selling price overrides based on the provided sellingPriceGroupId,
   * then applies the customerGroup percent adjustment (discount/markup) if applicable.
   */
  async getSellingPrice(
    variationId: number,
    customerGroupId?: number,
    sellingPriceGroupId?: number,
  ): Promise<{ sellPriceIncTax: number; defaultSellPrice: number }> {
    const variation = await this.prisma.variation.findUnique({
      where: { id: variationId },
      include: { product: true },
    });

    if (!variation) {
      throw new NotFoundException('Variation not found');
    }

    let sellPriceIncTax = Number(variation.sellPriceIncTax ?? 0);
    let defaultSellPrice = Number(variation.defaultSellPrice ?? 0);

    // Calculate dynamic tax rate percentage from original prices if available
    const taxPercent =
      defaultSellPrice > 0 ? ((sellPriceIncTax - defaultSellPrice) / defaultSellPrice) * 100 : 0;

    // Apply selling price group override if specified
    if (sellingPriceGroupId) {
      const groupPrice = await this.prisma.variationGroupPrice.findFirst({
        where: { variationId, priceGroupId: sellingPriceGroupId },
      });
      if (groupPrice) {
        sellPriceIncTax = Number(groupPrice.priceIncTax);
        defaultSellPrice =
          taxPercent > 0 ? sellPriceIncTax / (1 + taxPercent / 100) : sellPriceIncTax;
      }
    }

    // Apply customer group percentage discount/markup if specified
    if (customerGroupId) {
      const customerGroup = await this.prisma.customerGroup.findUnique({
        where: { id: customerGroupId },
      });
      if (customerGroup && customerGroup.amount !== 0) {
        const percent = customerGroup.amount;
        sellPriceIncTax = sellPriceIncTax + (percent * sellPriceIncTax) / 100;
        defaultSellPrice = defaultSellPrice + (percent * defaultSellPrice) / 100;
      }
    }

    return {
      sellPriceIncTax: Number(sellPriceIncTax.toFixed(4)),
      defaultSellPrice: Number(defaultSellPrice.toFixed(4)),
    };
  }

  /**
   * Calculates the profit margin percentage of a variation.
   * Margin = ((sellingPrice - purchasePrice) / purchasePrice) * 100
   */
  async getProfitMargin(variationId: number): Promise<number> {
    const purchasePrice = await this.getPurchasePrice(variationId);
    const sellingPriceInfo = await this.getSellingPrice(variationId);
    const sellingPrice = sellingPriceInfo.defaultSellPrice;

    if (purchasePrice === 0) {
      return 0;
    }

    const margin = ((sellingPrice - purchasePrice) / purchasePrice) * 100;
    return Number(margin.toFixed(4));
  }

  /**
   * Retrieves full pricing details (purchase price, sell price, margins)
   * for all variations belonging to a product.
   */
  async getProductPricingDetails(
    productId: number,
    businessId: number,
    customerGroupId?: number,
    sellingPriceGroupId?: number,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variations = await this.prisma.variation.findMany({
      where: { productId, deletedAt: null },
      include: {
        productVariation: true,
      },
      orderBy: { id: 'asc' },
    });

    const details = [];
    for (const variation of variations) {
      const purchasePrice = await this.getPurchasePrice(variation.id);
      const originalPrices = {
        defaultSellPrice: Number(variation.defaultSellPrice ?? 0),
        sellPriceIncTax: Number(variation.sellPriceIncTax ?? 0),
      };
      const calculatedPrices = await this.getSellingPrice(
        variation.id,
        customerGroupId,
        sellingPriceGroupId,
      );
      const profitMargin = await this.getProfitMargin(variation.id);

      details.push({
        variationId: variation.id,
        name: variation.name,
        subSku: variation.subSku,
        productVariationName: variation.productVariation.name,
        purchasePrice,
        originalPrices,
        calculatedPrices,
        profitMargin,
      });
    }

    return {
      productId: product.id,
      productName: product.name,
      productType: product.type,
      variations: details,
    };
  }

  /**
   * Batch sets or updates selling price group overrides for a product's variations.
   */
  async setGroupPrices(productId: number, businessId: number, dto: SetGroupPricesDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variations = await this.prisma.variation.findMany({
      where: { productId, deletedAt: null },
      select: { id: true },
    });

    const validVariationIds = new Set(variations.map((v) => v.id));

    // Verify all specified variations belong to this product
    for (const gp of dto.groupPrices) {
      if (!validVariationIds.has(gp.variationId)) {
        throw new BadRequestException(
          `Variation ID ${gp.variationId} does not belong to product ID ${productId}`,
        );
      }
    }

    // Process overrides sequentially in a transaction to handle non-unique index updates correctly
    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const gp of dto.groupPrices) {
        const existing = await tx.variationGroupPrice.findFirst({
          where: { variationId: gp.variationId, priceGroupId: gp.priceGroupId },
        });

        if (existing) {
          const updated = await tx.variationGroupPrice.update({
            where: { id: existing.id },
            data: { priceIncTax: gp.priceIncTax },
          });
          results.push(updated);
        } else {
          const created = await tx.variationGroupPrice.create({
            data: {
              variationId: gp.variationId,
              priceGroupId: gp.priceGroupId,
              priceIncTax: gp.priceIncTax,
            },
          });
          results.push(created);
        }
      }
      return { success: true, count: results.length };
    });
  }
}
