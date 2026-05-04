export interface SaleReturnLine {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  note: string | null;
}

export interface SaleReturnProps {
  id: number;
  businessId: number;
  contactId: number | null;
  invoiceNo: string;
  status: string;
  paymentStatus: string;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount: number;
  note: string | null;
  returnDate: Date;
  returnOfId: number;
  createdBy: number;
  lines: SaleReturnLine[];
}

export class SaleReturn {
  readonly id: number;
  readonly businessId: number;
  readonly contactId: number | null;
  readonly invoiceNo: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly shippingAmount: number;
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly note: string | null;
  readonly returnDate: Date;
  readonly returnOfId: number;
  readonly createdBy: number;
  readonly lines: SaleReturnLine[];

  constructor(props: SaleReturnProps) {
    Object.assign(this, props);
  }
}

export interface OriginalSaleLine {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface OriginalSale {
  id: number;
  businessId: number;
  contactId: number | null;
  invoiceNo: string;
  status: string;
  type: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  lines: OriginalSaleLine[];
}
