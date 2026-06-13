import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import type { Purchase } from '../../domain/purchase.entity';
import type { IPurchaseRepository } from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';

export interface PurchaseReturnLineInput {
  productId: number;
  quantity: number;
  unitCost: number;
  note?: string;
}

export interface CreatePurchaseReturnInput {
  lines: PurchaseReturnLineInput[];
  note?: string;
}

@Injectable()
export class CreatePurchaseReturnUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
  ) {}

  async execute(
    purchaseId: number,
    businessId: number,
    userId: number,
    input: CreatePurchaseReturnInput,
  ): Promise<Purchase> {
    const original = await this.repo.findById(purchaseId, businessId);
    if (!original) throw new NotFoundException(`Purchase #${purchaseId} not found`);
    if (original.isReturn()) throw new BadRequestException('Cannot return a return transaction');
    if (!input.lines?.length) throw new BadRequestException('Return must have at least one line');

    for (const line of input.lines) {
      const originalLine = original.lines.find((l) => l.productId === line.productId);
      if (!originalLine) {
        throw new BadRequestException(
          `Product #${line.productId} was not part of purchase #${purchaseId}`,
        );
      }
      if (line.quantity > originalLine.quantity) {
        throw new BadRequestException(
          `Cannot return ${line.quantity} units of product #${line.productId} — only ${originalLine.quantity} were purchased`,
        );
      }
    }

    const today = new Date();
    const prefix = `PRR-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const rows = (await (this.repo as any).countReturns?.(businessId)) ?? 0;
    const refNo = `${prefix}-${String(rows + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const lines = input.lines.map((l) => {
      const lineTotal = Number((l.quantity * l.unitCost).toFixed(4));
      totalAmount += lineTotal;
      return {
        productId: l.productId,
        quantity: l.quantity,
        unitCostBefore: l.unitCost,
        unitCostAfter: l.unitCost,
        discountAmount: 0,
        taxAmount: 0,
        lineTotal,
        note: l.note,
      };
    });

    return this.repo.create({
      businessId,
      userId,
      refNo,
      contactId: original.contactId,
      returnOfId: purchaseId,
      status: 'return',
      paymentStatus: 'paid',
      type: 'purchase_return',
      taxAmount: 0,
      discountAmount: 0,
      shippingAmount: 0,
      totalAmount,
      paidAmount: totalAmount,
      note: input.note ?? `Return for ${original.refNo ?? '#' + purchaseId}`,
      purchaseDate: new Date(),
      addStock: false,
      removeStock: true,
      lines,
    });
  }
}
