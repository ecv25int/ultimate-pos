import type { Purchase } from './purchase.entity';

export interface CreatePurchaseLineData {
  productId: number;
  quantity: number;
  unitCostBefore: number;
  unitCostAfter: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  note?: string;
}

export interface CreatePurchaseData {
  businessId: number;
  userId: number;
  refNo: string;
  contactId?: number | null;
  returnOfId?: number | null;
  status: string;
  paymentStatus: string;
  type: string;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount: number;
  note?: string | null;
  purchaseDate: Date;
  lines: CreatePurchaseLineData[];
  addStock: boolean;
  removeStock?: boolean;
}

export interface UpdatePurchaseData {
  contactId?: number | null;
  status?: string;
  paymentStatus?: string;
  taxAmount?: number;
  discountAmount?: number;
  shippingAmount?: number;
  paidAmount?: number;
  note?: string | null;
}

export interface PurchaseFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  contactId?: number;
  type?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPurchases {
  total: number;
  page: number;
  limit: number;
  data: Purchase[];
}

export interface PurchaseSummary {
  totalPurchases: number;
  ordered: number;
  received: number;
  pending: number;
  due: number;
  partial: number;
  totalSpend: number;
  totalPaid: number;
  outstanding: number;
}

export interface IPurchaseRepository {
  create(data: CreatePurchaseData): Promise<Purchase>;
  findById(id: number, businessId: number): Promise<Purchase | null>;
  findAll(businessId: number, filters: PurchaseFilters): Promise<PaginatedPurchases>;
  update(id: number, businessId: number, data: UpdatePurchaseData): Promise<Purchase>;
  remove(id: number, businessId: number): Promise<void>;
  getSummary(businessId: number): Promise<PurchaseSummary>;
  generateRefNo(businessId: number): Promise<string>;
  countReturns(businessId: number): Promise<number>;
  convertToOrder(id: number, businessId: number): Promise<Purchase>;
}

export const PURCHASE_REPOSITORY = Symbol('IPurchaseRepository');
