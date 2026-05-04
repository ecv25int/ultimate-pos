import type { OriginalSale, SaleReturn } from './sale-return.entity';

export interface CreateSaleReturnLineData {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  note?: string;
}

export interface CreateSaleReturnData {
  businessId: number;
  userId: number;
  invoiceNo: string;
  contactId: number | null;
  returnOfId: number;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  paidAmount: number;
  note: string | null;
  lines: CreateSaleReturnLineData[];
}

export interface ISaleReturnRepository {
  findOriginalWithLines(saleId: number, businessId: number): Promise<OriginalSale | null>;
  create(data: CreateSaleReturnData): Promise<SaleReturn>;
  findById(id: number, businessId: number): Promise<SaleReturn | null>;
  findBySaleId(saleId: number, businessId: number): Promise<SaleReturn[]>;
  generateInvoiceNo(businessId: number): Promise<string>;
}

export const SALE_RETURN_REPOSITORY = Symbol('ISaleReturnRepository');
