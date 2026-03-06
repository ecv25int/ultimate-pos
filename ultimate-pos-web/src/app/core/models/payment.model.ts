export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export interface Payment {
  id: number;
  businessId: number;
  saleId?: number;
  purchaseId?: number;
  amount: number;
  method: PaymentMethod;
  referenceNo?: string;
  note?: string;
  paymentDate: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  sale?: { id: number; invoiceNo: string; totalAmount: number };
  purchase?: { id: number; referenceNo: string; totalAmount: number };
}

export interface CreatePaymentDto {
  saleId?: number;
  purchaseId?: number;
  amount: number;
  method?: PaymentMethod;
  referenceNo?: string;
  note?: string;
  paymentDate?: string;
}

export interface BulkPaymentDto {
  payments: CreatePaymentDto[];
}
