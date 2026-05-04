export interface PurchaseLine {
  id: number;
  productId: number;
  quantity: number;
  unitCostBefore: number;
  unitCostAfter: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  note: string | null;
}

export interface PurchaseProps {
  id: number;
  businessId: number;
  contactId: number | null;
  refNo: string;
  status: string;
  paymentStatus: string;
  type: string;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount: number;
  note: string | null;
  purchaseDate: Date;
  returnOfId: number | null;
  createdBy: number;
  lines: PurchaseLine[];
}

const FINALIZED_STATUSES = ['received', 'completed', 'cancelled'] as const;

export class Purchase {
  readonly id: number;
  readonly businessId: number;
  readonly contactId: number | null;
  readonly refNo: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly type: string;
  readonly taxAmount: number;
  readonly discountAmount: number;
  readonly shippingAmount: number;
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly note: string | null;
  readonly purchaseDate: Date;
  readonly returnOfId: number | null;
  readonly createdBy: number;
  readonly lines: PurchaseLine[];

  constructor(props: PurchaseProps) {
    Object.assign(this, props);
  }

  isFinalized(): boolean {
    return FINALIZED_STATUSES.includes(this.status as (typeof FINALIZED_STATUSES)[number]);
  }

  isEditable(): boolean {
    return !this.isFinalized();
  }

  isReturn(): boolean {
    return this.type === 'purchase_return';
  }

  isRequisition(): boolean {
    return this.type === 'requisition';
  }
}
