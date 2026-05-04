import { Payment } from '../domain/payment.entity';

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object' && 'toNumber' in v) return (v as any).toNumber();
  return Number(v ?? 0);
}

export class PaymentMapper {
  static toEntity(row: any): Payment {
    return new Payment({
      id: row.id,
      businessId: row.businessId,
      saleId: row.saleId ?? null,
      purchaseId: row.purchaseId ?? null,
      amount: toNum(row.amount),
      method: row.method,
      referenceNo: row.referenceNo ?? null,
      note: row.note ?? null,
      paymentDate: row.paymentDate,
      createdBy: row.createdBy,
    });
  }
}
