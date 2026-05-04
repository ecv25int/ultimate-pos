import { Transaction } from '../domain/transaction.entity';
import { TransactionType } from '../domain/transaction-type';

function toNum(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value ?? 0);
}

export class TransactionMapper {
  static fromSale(row: any): Transaction {
    const totalAmount = toNum(row.totalAmount);
    const taxAmount = toNum(row.taxAmount);
    const discountAmount = toNum(row.discountAmount);
    return new Transaction({
      id: row.id,
      type: 'sale' as TransactionType,
      status: row.status,
      refNo: row.invoiceNo,
      businessId: row.businessId,
      contactId: row.contactId,
      userId: row.createdBy,
      paymentStatus: row.paymentStatus,
      date: row.transactionDate,
      note: row.note,
      totalBeforeTax: Math.max(totalAmount - taxAmount + discountAmount, 0),
      taxAmount,
      discountAmount,
      totalAmount,
      metadata: {
        invoiceNo: row.invoiceNo,
        contactName: row.contact?.name ?? null,
      },
    });
  }

  static fromPurchase(row: any): Transaction {
    const totalAmount = toNum(row.totalAmount);
    const taxAmount = toNum(row.taxAmount);
    const discountAmount = toNum(row.discountAmount);
    return new Transaction({
      id: row.id,
      type: 'purchase' as TransactionType,
      status: row.status,
      refNo: row.refNo,
      businessId: row.businessId,
      contactId: row.contactId,
      userId: row.createdBy,
      paymentStatus: row.paymentStatus,
      date: row.purchaseDate,
      note: row.note,
      totalBeforeTax: Math.max(totalAmount - taxAmount + discountAmount, 0),
      taxAmount,
      discountAmount,
      totalAmount,
      metadata: { contactName: row.contact?.name ?? null },
    });
  }

  static fromExpense(row: any): Transaction {
    const totalAmount = toNum(row.totalAmount);
    const taxAmount = toNum(row.taxAmount);
    return new Transaction({
      id: row.id,
      type: 'expense' as TransactionType,
      status: row.deletedAt ? 'cancelled' : 'final',
      refNo: row.refNo,
      businessId: row.businessId,
      userId: row.createdBy,
      date: row.expenseDate,
      note: row.note,
      totalBeforeTax: toNum(row.amount),
      taxAmount,
      discountAmount: 0,
      totalAmount,
      metadata: {
        expenseCategoryId: row.expenseCategoryId,
        expenseCategoryName: row.category?.name ?? null,
      },
    });
  }

  static fromStockTransfer(row: any): Transaction {
    const qty = toNum(row.quantity);
    return new Transaction({
      id: row.id,
      type: 'stock_transfer' as TransactionType,
      status: row.status,
      refNo: row.referenceNo,
      businessId: row.businessId,
      userId: row.createdBy,
      date: row.createdAt,
      note: row.note,
      totalBeforeTax: qty,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: qty,
      metadata: {
        productId: row.productId,
        productName: row.product?.name ?? null,
        fromLocation: row.fromLocation,
        toLocation: row.toLocation,
      },
    });
  }

  static fromStockAdjustment(row: any): Transaction {
    const totalAmount = toNum(row.totalAmount);
    return new Transaction({
      id: row.id,
      type: 'stock_adjustment' as TransactionType,
      status: row.status,
      refNo: row.referenceNo,
      businessId: row.businessId,
      locationId: row.locationId,
      userId: row.createdBy,
      date: row.createdAt,
      note: row.note,
      totalBeforeTax: totalAmount,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount,
      metadata: {
        locationName: row.location?.name ?? null,
        adjustmentType: row.adjustmentType,
        finalised: row.finalised,
      },
    });
  }
}
