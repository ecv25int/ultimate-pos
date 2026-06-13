import type { OriginalSale } from './sale-return.entity';

export interface ReturnLineRequest {
  productId: number;
  quantity: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SaleReturnValidatorService {
  validate(original: OriginalSale, returnLines: ReturnLineRequest[]): ValidationResult {
    const errors: string[] = [];

    if (!['final', 'completed'].includes(original.status)) {
      errors.push(
        `Sale #${original.id} must be finalized before a return can be created (current status: ${original.status})`,
      );
    }

    if (original.type === 'sale_return') {
      errors.push('Cannot create a return from a return transaction');
    }

    for (const returnLine of returnLines) {
      const originalLine = original.lines.find((l) => l.productId === returnLine.productId);
      if (!originalLine) {
        errors.push(`Product #${returnLine.productId} was not part of sale #${original.id}`);
        continue;
      }
      if (returnLine.quantity <= 0) {
        errors.push(`Return quantity for product #${returnLine.productId} must be positive`);
      }
      if (returnLine.quantity > originalLine.quantity) {
        errors.push(
          `Cannot return ${returnLine.quantity} units of product #${returnLine.productId} — only ${originalLine.quantity} were sold`,
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  calculateLineTotals(
    original: OriginalSale,
    returnLines: ReturnLineRequest[],
  ): Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
  }> {
    return returnLines.map((rl) => {
      const orig = original.lines.find((l) => l.productId === rl.productId)!;
      const proportion = orig.quantity > 0 ? rl.quantity / orig.quantity : 0;
      const unitPrice = orig.unitPrice;
      const discountAmount = Number((orig.discountAmount * proportion).toFixed(4));
      const taxAmount = Number((orig.taxAmount * proportion).toFixed(4));
      const lineTotal = Number((rl.quantity * unitPrice - discountAmount + taxAmount).toFixed(4));
      return {
        productId: rl.productId,
        quantity: rl.quantity,
        unitPrice,
        discountAmount,
        taxAmount,
        lineTotal,
      };
    });
  }
}
