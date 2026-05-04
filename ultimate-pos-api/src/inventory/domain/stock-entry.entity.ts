export interface StockEntryProps {
  id: number;
  businessId: number;
  productId: number;
  entryType: string;
  quantity: number;
  unitCost: number | null;
  referenceNo: string | null;
  note: string | null;
  createdBy: number;
  createdAt: Date;
}

export class StockEntry {
  readonly id: number;
  readonly businessId: number;
  readonly productId: number;
  readonly entryType: string;
  readonly quantity: number;
  readonly unitCost: number | null;
  readonly referenceNo: string | null;
  readonly note: string | null;
  readonly createdBy: number;
  readonly createdAt: Date;

  constructor(props: StockEntryProps) {
    Object.assign(this, props);
  }

  isInflow(): boolean {
    return this.quantity > 0;
  }

  isOutflow(): boolean {
    return this.quantity < 0;
  }

  isAdjustment(): boolean {
    return this.entryType === 'adjustment_in' || this.entryType === 'adjustment_out';
  }
}
