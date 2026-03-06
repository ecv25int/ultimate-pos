export type StockTransferStatus = 'pending' | 'completed' | 'cancelled';

export interface StockTransfer {
  id: number;
  businessId: number;
  productId: number;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  referenceNo?: string;
  note?: string;
  status: StockTransferStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  product?: { id: number; name: string; sku: string };
}

export interface CreateStockTransferDto {
  productId: number;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  referenceNo?: string;
  note?: string;
  status?: StockTransferStatus;
}
