import { TransactionType } from '../domain/transaction-type';
import { Transaction } from '../domain/transaction.entity';

export class TransactionDto {
  id: number;
  type: TransactionType;
  status: string;
  refNo: string | null;
  businessId: number;
  contactId?: number | null;
  userId: number;
  locationId?: number | null;
  paymentStatus?: string | null;
  date: string;
  note?: string | null;
  totalBeforeTax: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  metadata?: Record<string, unknown>;

  static fromEntity(entity: Transaction): TransactionDto {
    const dto = new TransactionDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.status = entity.status;
    dto.refNo = entity.refNo;
    dto.businessId = entity.businessId;
    dto.contactId = entity.contactId;
    dto.userId = entity.userId;
    dto.locationId = entity.locationId;
    dto.paymentStatus = entity.paymentStatus;
    dto.date = entity.date.toISOString();
    dto.note = entity.note;
    dto.totalBeforeTax = entity.totalBeforeTax;
    dto.taxAmount = entity.taxAmount;
    dto.discountAmount = entity.discountAmount;
    dto.totalAmount = entity.totalAmount;
    dto.metadata = entity.metadata;
    return dto;
  }
}
