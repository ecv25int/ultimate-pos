export type PurchaseStatus = 'ordered' | 'pending' | 'received' | 'cancelled';
export type PurchasePaymentStatus = 'due' | 'partial' | 'paid';
export type PurchaseType = 'purchase' | 'requisition' | 'purchase_return';

export interface PurchaseLine {
  id: number;
  purchaseId: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitCostBefore: number;
  unitCostAfter: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  note?: string;
}

export interface Purchase {
  id: number;
  businessId: number;
  contactId?: number;
  refNo: string;
  type?: PurchaseType;
  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount: number;
  note?: string;
  purchaseDate: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  contact?: { id: number; name: string };
  lines: PurchaseLine[];
}

export interface PurchaseSummary {
  total: number;
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  byStatus: Record<PurchaseStatus, number>;
  byPaymentStatus: Record<PurchasePaymentStatus, number>;
}

export interface PurchaseListResponse {
  data: Purchase[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePurchaseLineDto {
  productId: number;
  quantity: number;
  unitCostBefore: number;
  unitCostAfter: number;
  discountAmount?: number;
  taxAmount?: number;
  note?: string;
}

export interface CreatePurchaseDto {
  contactId?: number;
  refNo?: string;
  status?: PurchaseStatus;
  paymentStatus?: PurchasePaymentStatus;
  type?: PurchaseType;
  taxAmount?: number;
  discountAmount?: number;
  shippingAmount?: number;
  paidAmount?: number;
  note?: string;
  purchaseDate?: string;
  lines: CreatePurchaseLineDto[];
}
