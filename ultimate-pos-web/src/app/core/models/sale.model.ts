export type SaleStatus = 'draft' | 'final' | 'pending' | 'completed';
export type PaymentStatus = 'due' | 'partial' | 'paid' | 'overdue';
export type DiscountType = 'fixed' | 'percentage';

export interface SaleLineItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  note?: string;
  product?: { id: number; name: string; sku: string; type?: string };
}

export interface Sale {
  id: number;
  businessId: number;
  contactId?: number;
  invoiceNo: string;
  type?: string;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  discountType: DiscountType;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount: number;
  note?: string;
  transactionDate: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  contact?: { id: number; name: string; mobile: string; email?: string };
  lines: SaleLineItem[];
}

export interface SaleListItem {
  id: number;
  invoiceNo: string;
  type: string;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  transactionDate: string;
  createdAt: string;
  contact?: { id: number; name: string; mobile: string };
  lines: { id: number; quantity: number; unitPrice: number; lineTotal: number }[];
}

export interface SaleListResponse {
  total: number;
  page: number;
  limit: number;
  data: SaleListItem[];
}

export interface SaleSummary {
  totalSales: number;
  draft: number;
  final: number;
  pending: number;
  due: number;
  partial: number;
  totalRevenue: number;
  totalCollected: number;
  outstanding: number;
}

export interface CreateSaleLineDto {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  note?: string;
}

export interface CreateSaleDto {
  contactId?: number;
  status?: SaleStatus;
  type?: string;
  paymentStatus?: PaymentStatus;
  discountType?: DiscountType;
  discountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  paidAmount?: number;
  note?: string;
  transactionDate?: string;
  lines: CreateSaleLineDto[];
}
