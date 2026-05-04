import { Purchase } from '../domain/purchase.entity';

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object' && 'toNumber' in v) return (v as any).toNumber();
  return Number(v ?? 0);
}

export class PurchaseMapper {
  static toEntity(row: any): Purchase {
    return new Purchase({
      id: row.id,
      businessId: row.businessId,
      contactId: row.contactId ?? null,
      refNo: row.refNo ?? '',
      status: row.status,
      paymentStatus: row.paymentStatus,
      type: row.type,
      taxAmount: toNum(row.taxAmount),
      discountAmount: toNum(row.discountAmount),
      shippingAmount: toNum(row.shippingAmount),
      totalAmount: toNum(row.totalAmount),
      paidAmount: toNum(row.paidAmount),
      note: row.note ?? null,
      purchaseDate: row.purchaseDate,
      returnOfId: row.returnOfId ?? null,
      createdBy: row.createdBy,
      lines: (row.lines ?? []).map((l: any) => ({
        id: l.id,
        productId: l.productId,
        quantity: toNum(l.quantity),
        unitCostBefore: toNum(l.unitCostBefore),
        unitCostAfter: toNum(l.unitCostAfter),
        discountAmount: toNum(l.discountAmount),
        taxAmount: toNum(l.taxAmount),
        lineTotal: toNum(l.lineTotal),
        note: l.note ?? null,
      })),
    });
  }
}
