import { TransactionType } from './create-transaction.dto';

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
}