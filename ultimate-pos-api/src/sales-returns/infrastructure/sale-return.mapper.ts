import type { OriginalSale, SaleReturn } from '../domain/sale-return.entity';

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object' && 'toNumber' in v) return (v as any).toNumber();
  return Number(v ?? 0);
}

export class SaleReturnMapper {
  static toEntity(row: any): SaleReturn {
    return {
      id: row.id,
      businessId: row.businessId,
      contactId: row.contactId ?? null,
      invoiceNo: row.invoiceNo,
      status: row.status,
      paymentStatus: row.paymentStatus,
      discountAmount: toNum(row.discountAmount),
      taxAmount: toNum(row.taxAmount),
      shippingAmount: toNum(row.shippingAmount),
      totalAmount: toNum(row.totalAmount),
      paidAmount: toNum(row.paidAmount),
      note: row.note ?? null,
      returnDate: row.transactionDate,
      returnOfId: row.returnOfId,
      createdBy: row.createdBy,
      lines: (row.lines ?? []).map((l: any) => ({
        id: l.id,
        productId: l.productId,
        quantity: toNum(l.quantity),
        unitPrice: toNum(l.unitPrice),
        discountAmount: toNum(l.discountAmount),
        taxAmount: toNum(l.taxAmount),
        lineTotal: toNum(l.lineTotal),
        note: l.note ?? null,
      })),
    } as SaleReturn;
  }

  static toOriginalSale(row: any): OriginalSale {
    return {
      id: row.id,
      businessId: row.businessId,
      contactId: row.contactId ?? null,
      invoiceNo: row.invoiceNo,
      status: row.status,
      type: row.type,
      totalAmount: toNum(row.totalAmount),
      taxAmount: toNum(row.taxAmount),
      discountAmount: toNum(row.discountAmount),
      lines: (row.lines ?? []).map((l: any) => ({
        id: l.id,
        productId: l.productId,
        quantity: toNum(l.quantity),
        unitPrice: toNum(l.unitPrice),
        discountAmount: toNum(l.discountAmount),
        taxAmount: toNum(l.taxAmount),
        lineTotal: toNum(l.lineTotal),
      })),
    };
  }
}
