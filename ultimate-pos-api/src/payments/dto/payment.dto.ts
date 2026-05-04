import type { Payment } from '../domain/payment.entity';

export class PaymentDto {
  id: number;
  businessId: number;
  saleId: number | null;
  purchaseId: number | null;
  amount: number;
  method: string;
  referenceNo: string | null;
  note: string | null;
  paymentDate: Date;
  createdBy: number;

  static fromEntity(entity: Payment): PaymentDto {
    const dto = new PaymentDto();
    dto.id = entity.id;
    dto.businessId = entity.businessId;
    dto.saleId = entity.saleId;
    dto.purchaseId = entity.purchaseId;
    dto.amount = entity.amount;
    dto.method = entity.method;
    dto.referenceNo = entity.referenceNo;
    dto.note = entity.note;
    dto.paymentDate = entity.paymentDate;
    dto.createdBy = entity.createdBy;
    return dto;
  }
}
