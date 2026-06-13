import type { Payment } from './payment.entity';

export interface CreatePaymentData {
  businessId: number;
  userId: number;
  saleId?: number | null;
  purchaseId?: number | null;
  amount: number;
  method: string;
  referenceNo?: string | null;
  note?: string | null;
  paymentDate: Date;
}

export interface PaymentFilters {
  saleId?: number;
  purchaseId?: number;
  method?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionRef {
  id: number;
  totalAmount: number;
  paidAmount: number;
}

export interface IPaymentRepository {
  create(data: CreatePaymentData): Promise<Payment>;
  findAll(businessId: number, filters: PaymentFilters): Promise<PaginatedPayments>;
  findById(id: number, businessId: number): Promise<Payment | null>;
  delete(id: number): Promise<void>;
  getTotalPaid(businessId: number, saleId?: number, purchaseId?: number): Promise<number>;
  findSale(saleId: number, businessId: number): Promise<TransactionRef | null>;
  findPurchase(purchaseId: number, businessId: number): Promise<TransactionRef | null>;
  updateSalePaymentStatus(saleId: number, paidAmount: number, paymentStatus: string): Promise<void>;
  updatePurchasePaymentStatus(
    purchaseId: number,
    paidAmount: number,
    paymentStatus: string,
  ): Promise<void>;
}

export const PAYMENT_REPOSITORY = Symbol('IPaymentRepository');
