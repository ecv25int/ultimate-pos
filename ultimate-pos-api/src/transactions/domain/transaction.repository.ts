import { Transaction } from './transaction.entity';
import { TransactionType } from './transaction-type';

export interface CreateTransactionData {
  type: TransactionType;
  businessId: number;
  userId: number;
  refNo: string;
  status: string;
  contactId?: number | null;
  locationId?: number | null;
  paymentStatus?: string;
  note?: string | null;
  date: Date;
  totalBeforeTax: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  expenseCategoryId?: number | null;
  productId?: number;
  quantity?: number;
  fromLocation?: string;
  toLocation?: string;
  adjustmentType?: string;
}

export interface UpdateTransactionData {
  contactId?: number | null;
  locationId?: number | null;
  paymentStatus?: string;
  note?: string | null;
  date?: Date;
  totalBeforeTax?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  expenseCategoryId?: number | null;
  productId?: number;
  quantity?: number;
  fromLocation?: string;
  toLocation?: string;
  adjustmentType?: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ITransactionRepository {
  create(data: CreateTransactionData): Promise<Transaction>;
  findById(id: number, businessId: number, type?: TransactionType): Promise<Transaction | null>;
  findAll(businessId: number, filters: TransactionFilters): Promise<PaginatedTransactions>;
  update(
    id: number,
    businessId: number,
    data: UpdateTransactionData,
    type?: TransactionType,
  ): Promise<Transaction>;
  updateStatus(
    id: number,
    businessId: number,
    newStatus: string,
    type?: TransactionType,
  ): Promise<Transaction>;
  inferType(id: number, businessId: number): Promise<TransactionType | null>;
  findRefNos(
    type: TransactionType,
    businessId: number,
    prefix: string,
  ): Promise<Array<string | null>>;
}

export const TRANSACTION_REPOSITORY = Symbol('ITransactionRepository');
