import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from './stock.service';

@Injectable()
export class BatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  /**
   * Tracks or updates batch quantity and expiry date.
   * If a batch doesn't exist, it creates a dummy opening stock purchase to log it.
   */
  async trackBatch(
    variationId: number,
    batchNumber: string,
    expiryDate: Date,
    quantity: number,
    businessId: number,
  ) {
    const existing = await this.prisma.purchaseLine.findFirst({
      where: {
        variationId,
        batchNumber,
        purchase: { businessId },
      },
    });

    if (existing) {
      return this.prisma.purchaseLine.update({
        where: { id: existing.id },
        data: {
          quantity: Number(existing.quantity) + quantity,
          expiryDate,
        },
      });
    }

    const variation = await this.prisma.variation.findUnique({
      where: { id: variationId },
      select: { productId: true },
    });
    if (!variation) throw new NotFoundException(`Variation #${variationId} not found`);

    // Create the purchase first to avoid complex nested creation types in Prisma
    const purchase = await this.prisma.purchase.create({
      data: {
        businessId,
        refNo: `BATCH-${batchNumber}-${Date.now()}`,
        status: 'received',
        paymentStatus: 'paid',
        type: 'opening_stock',
        totalAmount: 0,
        createdBy: 1,
        purchaseDate: new Date(),
      },
    });

    return this.prisma.purchaseLine.create({
      data: {
        purchaseId: purchase.id,
        productId: variation.productId,
        variationId,
        quantity,
        batchNumber,
        expiryDate,
        unitCostBefore: 0,
        unitCostAfter: 0,
        lineTotal: 0,
      },
    });
  }

  /**
   * Retrieves the purchase line corresponding to a lot/batch.
   */
  async getPurchaseLineForBatch(variationId: number, batchNumber: string) {
    return this.prisma.purchaseLine.findFirst({
      where: { variationId, batchNumber },
      include: { purchase: true },
    });
  }

  /**
   * Returns items expiring within 7 days, or already expired, with remaining stock.
   */
  async checkExpiryItems(businessId: number, locationId?: number) {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const where: any = {
      purchase: {
        businessId,
        status: 'received',
      },
      expiryDate: { not: null },
    };

    const lines = await this.prisma.purchaseLine.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variation: { select: { id: true, name: true, subSku: true } },
        purchase: { select: { id: true, refNo: true } },
      },
    });

    const result = [];
    for (const line of lines) {
      const remaining =
        Number(line.quantity) - Number(line.quantitySold) - Number(line.quantityAdjusted);
      if (remaining <= 0) continue;

      const expiry = new Date(line.expiryDate!);
      let alertType = 'normal';

      if (expiry < today) {
        alertType = 'expired';
      } else if (expiry <= sevenDaysFromNow) {
        alertType = 'expiring_soon';
      } else {
        continue;
      }

      result.push({
        purchaseLineId: line.id,
        productId: line.productId,
        productName: line.product.name,
        variationId: line.variationId,
        variationName: line.variation?.name ?? '',
        sku: line.variation?.subSku ?? line.product.sku,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate,
        remainingQty: remaining,
        purchaseRefNo: line.purchase.refNo,
        alertType,
      });
    }

    return result;
  }

  /**
   * Maps sell lines to purchase lines in FIFO order, updating quantity_sold on purchases.
   */
  async mapPurchaseSell(
    sellLineId: number,
    variationId: number,
    quantity: number,
    businessId: number,
    locationId: number,
    tx?: any,
  ) {
    const client = tx || this.prisma;

    const purchaseLines = await client.purchaseLine.findMany({
      where: {
        variationId,
        purchase: {
          businessId,
          status: 'received',
        },
      },
      include: {
        purchase: true,
      },
      orderBy: {
        purchase: {
          purchaseDate: 'asc', // FIFO
        },
      },
    });

    let qtyLeftToMap = quantity;
    const mappings = [];

    for (const pl of purchaseLines) {
      const remaining = Number(pl.quantity) - Number(pl.quantitySold) - Number(pl.quantityAdjusted);
      if (remaining <= 0) continue;

      const alloc = Math.min(remaining, qtyLeftToMap);
      qtyLeftToMap -= alloc;

      const mapping = await client.transactionSellLinesPurchaseLines.create({
        data: {
          sellLineId,
          purchaseLineId: pl.id,
          quantity: alloc,
        },
      });

      mappings.push(mapping);

      await client.purchaseLine.update({
        where: { id: pl.id },
        data: {
          quantitySold: Number(pl.quantitySold) + alloc,
        },
      });

      if (qtyLeftToMap <= 0) break;
    }

    return mappings;
  }

  /**
   * Marks a specific purchase line's remaining quantity as expired by creating a stock adjustment.
   */
  async markExpired(purchaseLineId: number, businessId: number, userId: number) {
    const pl = await this.prisma.purchaseLine.findFirst({
      where: {
        id: purchaseLineId,
        purchase: { businessId },
      },
      include: {
        purchase: true,
      },
    });

    if (!pl) {
      throw new NotFoundException(`Purchase line #${purchaseLineId} not found`);
    }

    const remaining = Number(pl.quantity) - Number(pl.quantitySold) - Number(pl.quantityAdjusted);
    if (remaining <= 0) {
      throw new BadRequestException('No remaining stock in this batch to mark as expired');
    }

    const defaultLoc = await this.prisma.businessLocation.findFirst({
      where: { businessId, isActive: true },
      orderBy: { id: 'asc' },
    });
    if (!defaultLoc) throw new BadRequestException('No active business locations found');

    // Create a stock adjustment to record this expiry
    return this.prisma.$transaction(async (tx) => {
      // 1. Create StockAdjustment
      const adjustment = await tx.stockAdjustment.create({
        data: {
          businessId,
          createdBy: userId,
          locationId: defaultLoc.id,
          referenceNo: `EXPIRY-ADJ-${pl.id}-${Date.now()}`,
          adjustmentType: 'expired',
          note: `Marked batch ${pl.batchNumber || ''} as expired`,
          status: 'received',
          finalised: true,
          finalisedAt: new Date(),
          totalAmount: remaining * Number(pl.unitCostAfter),
        },
      });

      // 2. Create StockAdjustmentLine
      await tx.stockAdjustmentLine.create({
        data: {
          adjustmentId: adjustment.id,
          variationId: pl.variationId,
          quantity: -remaining,
          unitPrice: pl.unitCostAfter,
          reason: 'expiry',
        },
      });

      // 3. Update the purchase line's quantityAdjusted
      await tx.purchaseLine.update({
        where: { id: pl.id },
        data: {
          quantityAdjusted: Number(pl.quantityAdjusted) + remaining,
        },
      });

      // 4. Update the stock level and record movement history
      if (pl.variationId) {
        await this.stockService.updateStockLevel(
          pl.variationId,
          defaultLoc.id,
          -remaining,
          'adjustment',
          adjustment.referenceNo ?? undefined,
          adjustment.note ?? undefined,
          tx,
        );
      }

      return adjustment;
    });
  }
}
