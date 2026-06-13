import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../products/pricing.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Fetches the current stock quantity of a variation at a specific location.
   */
  async getStockLevel(variationId: number, locationId: number): Promise<number> {
    const detail = await this.prisma.variationLocationDetails.findFirst({
      where: { variationId, locationId },
    });
    return detail ? Number(detail.qtyAvailable) : 0;
  }

  /**
   * Fetches the movement logs for a variation at a specific location.
   */
  async getStockHistory(variationId: number, locationId: number) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { variationId, locationId },
      orderBy: { createdAt: 'desc' },
      include: {
        variation: {
          select: { id: true, name: true, subSku: true },
        },
      },
    });

    return movements.map((m) => ({
      id: m.id,
      date: m.createdAt,
      type: m.type,
      quantityChange: Number(m.quantity),
      referenceNo: m.referenceNo,
      note: m.note,
      variation: m.variation,
    }));
  }

  /**
   * Updates the stock level of a variation at a location and logs the history.
   * Runs in an optional transaction client context.
   */
  async updateStockLevel(
    variationId: number,
    locationId: number,
    delta: number,
    type: string, // 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return'
    referenceNo?: string,
    note?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;

    // Verify variation exists
    const variation = await client.variation.findUnique({
      where: { id: variationId },
      include: { product: true },
    });

    if (!variation) {
      throw new NotFoundException(`Variation #${variationId} not found`);
    }

    if (!variation.product.enableStock) {
      // If stock tracking is not enabled for the product, do nothing
      return;
    }

    // Perform upsert of VariationLocationDetails
    const existing = await client.variationLocationDetails.findFirst({
      where: { variationId, locationId },
    });

    if (existing) {
      const newQty = Number(existing.qtyAvailable) + delta;
      await client.variationLocationDetails.update({
        where: { id: existing.id },
        data: { qtyAvailable: newQty },
      });
    } else {
      await client.variationLocationDetails.create({
        data: {
          productId: variation.productId,
          productVariationId: variation.productVariationId,
          variationId,
          locationId,
          qtyAvailable: delta,
        },
      });
    }

    // Log the stock movement
    await client.stockMovement.create({
      data: {
        businessId: variation.product.businessId,
        variationId,
        locationId,
        type,
        quantity: delta,
        referenceNo: referenceNo ?? null,
        note: note ?? null,
      },
    });
  }

  /**
   * Checks if a location has at least the requested quantity of a variation.
   */
  async checkStockAvailability(
    variationId: number,
    locationId: number,
    qty: number,
  ): Promise<boolean> {
    const currentStock = await this.getStockLevel(variationId, locationId);
    return currentStock >= qty;
  }

  /**
   * Calculates total stock valuation based on variations' default/combo purchase costs.
   */
  async getStockValuation(businessId: number, locationId?: number) {
    const query: Prisma.VariationLocationDetailsWhereInput = {
      variation: {
        is: {
          product: {
            is: { businessId },
          },
        },
      },
    };
    if (locationId) {
      query.locationId = locationId;
    }

    const items = await this.prisma.variationLocationDetails.findMany({
      where: query,
      include: {
        location: { select: { id: true, name: true } },
        variation: {
          select: {
            id: true,
            name: true,
            defaultPurchasePrice: true,
            product: { select: { id: true, name: true, type: true } },
          },
        },
      },
    });

    let totalValuation = 0;
    const locationValuations = new Map<
      number,
      { locationId: number; name: string; valuation: number }
    >();

    for (const item of items) {
      const cost = await this.pricingService.getPurchasePrice(item.variationId);
      const qty = Number(item.qtyAvailable);
      const val = Math.max(qty, 0) * cost;
      totalValuation += val;

      const locId = item.locationId;
      if (!locationValuations.has(locId)) {
        locationValuations.set(locId, {
          locationId: locId,
          name: item.location.name,
          valuation: 0,
        });
      }
      locationValuations.get(locId)!.valuation += val;
    }

    return {
      totalValuation: Math.round(totalValuation * 100) / 100,
      locationValuations: Array.from(locationValuations.values()).map((lv) => ({
        ...lv,
        valuation: Math.round(lv.valuation * 100) / 100,
      })),
    };
  }

  /**
   * Lists all low stock items in a business, optionally filtered by location.
   */
  async getStockAlerts(businessId: number, locationId?: number) {
    const query: Prisma.VariationLocationDetailsWhereInput = {
      variation: {
        is: {
          product: {
            is: { businessId, enableStock: true },
          },
        },
      },
    };
    if (locationId) {
      query.locationId = locationId;
    }

    const items = await this.prisma.variationLocationDetails.findMany({
      where: query,
      include: {
        location: { select: { id: true, name: true } },
        variation: {
          include: {
            product: { select: { id: true, name: true, alertQuantity: true, sku: true } },
          },
        },
      },
    });

    const alerts = [];
    for (const item of items) {
      const qty = Number(item.qtyAvailable);
      const alertQty = Number(item.variation.product.alertQuantity);
      if (qty <= alertQty) {
        alerts.push({
          variationId: item.variationId,
          productId: item.productId,
          productName: item.variation.product.name,
          variationName: item.variation.name,
          sku: item.variation.product.sku,
          locationId: item.locationId,
          locationName: item.location.name,
          currentStock: qty,
          alertQuantity: alertQty,
          isLowStock: true,
        });
      }
    }

    return alerts;
  }

  /**
   * Fetches variation stock details for a specific location.
   */
  async getLocationStock(businessId: number, locationId: number) {
    const location = await this.prisma.businessLocation.findFirst({
      where: { id: locationId, businessId },
    });
    if (!location) {
      throw new NotFoundException(`Location #${locationId} not found`);
    }

    const details = await this.prisma.variationLocationDetails.findMany({
      where: { locationId },
      include: {
        variation: {
          select: {
            id: true,
            name: true,
            subSku: true,
            product: { select: { id: true, name: true, alertQuantity: true, sku: true } },
          },
        },
      },
    });

    return details.map((d) => ({
      variationId: d.variationId,
      productId: d.productId,
      productName: d.variation.product.name,
      variationName: d.variation.name,
      sku: d.variation.product.sku,
      qtyAvailable: Number(d.qtyAvailable),
      alertQuantity: Number(d.variation.product.alertQuantity),
      isLowStock: Number(d.qtyAvailable) <= Number(d.variation.product.alertQuantity),
    }));
  }

  /**
   * Aggregates all stock levels across all locations in a business.
   */
  async getAllStockLevels(businessId: number) {
    const locations = await this.prisma.businessLocation.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true },
    });

    const stocks = await this.prisma.variationLocationDetails.findMany({
      where: {
        location: { businessId, isActive: true },
      },
      include: {
        variation: {
          select: {
            id: true,
            name: true,
            subSku: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    return locations.map((loc) => {
      const locStocks = stocks
        .filter((s) => s.locationId === loc.id)
        .map((s) => ({
          variationId: s.variationId,
          productId: s.productId,
          productName: s.variation.product.name,
          variationName: s.variation.name,
          sku: s.variation.subSku,
          qtyAvailable: Number(s.qtyAvailable),
        }));

      return {
        locationId: loc.id,
        locationName: loc.name,
        stocks: locStocks,
      };
    });
  }
}
