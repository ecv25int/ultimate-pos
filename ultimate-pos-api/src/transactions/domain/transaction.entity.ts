import { TransactionType } from './transaction-type';

export interface TransactionProps {
  id: number;
  type: TransactionType;
  status: string;
  refNo: string | null;
  businessId: number;
  contactId?: number | null;
  userId: number;
  locationId?: number | null;
  paymentStatus?: string | null;
  date: Date;
  note?: string | null;
  totalBeforeTax: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  metadata?: Record<string, unknown>;
}

const LOCKED_STATUSES = ['final', 'received', 'completed', 'cancelled'] as const;

export class Transaction {
  readonly id: number;
  readonly type: TransactionType;
  readonly status: string;
  readonly refNo: string | null;
  readonly businessId: number;
  readonly contactId: number | null | undefined;
  readonly userId: number;
  readonly locationId: number | null | undefined;
  readonly paymentStatus: string | null | undefined;
  readonly date: Date;
  readonly note: string | null | undefined;
  readonly totalBeforeTax: number;
  readonly taxAmount: number;
  readonly discountAmount: number;
  readonly totalAmount: number;
  readonly metadata: Record<string, unknown>;

  constructor(props: TransactionProps) {
    this.id = props.id;
    this.type = props.type;
    this.status = props.status;
    this.refNo = props.refNo;
    this.businessId = props.businessId;
    this.contactId = props.contactId;
    this.userId = props.userId;
    this.locationId = props.locationId;
    this.paymentStatus = props.paymentStatus;
    this.date = props.date;
    this.note = props.note;
    this.totalBeforeTax = props.totalBeforeTax;
    this.taxAmount = props.taxAmount;
    this.discountAmount = props.discountAmount;
    this.totalAmount = props.totalAmount;
    this.metadata = props.metadata ?? {};
  }

  isLocked(): boolean {
    return LOCKED_STATUSES.includes(this.status.toLowerCase() as (typeof LOCKED_STATUSES)[number]);
  }

  canBeUpdated(): boolean {
    return !this.isLocked();
  }
}
