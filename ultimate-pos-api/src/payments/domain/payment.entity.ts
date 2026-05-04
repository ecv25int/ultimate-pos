export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'check', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentProps {
  id: number;
  businessId: number;
  saleId: number | null;
  purchaseId: number | null;
  amount: number;
  method: string;
  referenceNo: string | null;
  note: string | null;
  paymentDate: Date;
  createdBy: number;
}

export class Payment {
  readonly id: number;
  readonly businessId: number;
  readonly saleId: number | null;
  readonly purchaseId: number | null;
  readonly amount: number;
  readonly method: string;
  readonly referenceNo: string | null;
  readonly note: string | null;
  readonly paymentDate: Date;
  readonly createdBy: number;

  constructor(props: PaymentProps) {
    Object.assign(this, props);
  }

  isForSale(): boolean {
    return this.saleId != null;
  }

  isForPurchase(): boolean {
    return this.purchaseId != null;
  }
}
