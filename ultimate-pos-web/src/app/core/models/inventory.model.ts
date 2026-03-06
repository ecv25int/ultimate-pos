export type StockEntryType =
  | 'opening_stock'
  | 'purchase_in'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'sale_out'
  | 'sale_return';

export interface StockOverviewItem {
  id: number;
  name: string;
  sku: string;
  type: string;
  alertQuantity: number;
  currentStock: number;
  isLowStock: boolean;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  unit?: { id: number; actualName: string; shortName: string };
}

export interface StockEntry {
  id: number;
  businessId: number;
  productId: number;
  entryType: StockEntryType;
  quantity: number;
  unitCost?: number;
  referenceNo?: string;
  note?: string;
  createdBy: number;
  createdAt: string;
  product?: { id: number; name: string; sku: string };
}

export interface ProductStockHistory {
  product: { id: number; name: string; sku: string };
  currentStock: number;
  entries: StockEntry[];
}

export interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  adequateStock: number;
  totalStockValue: number;
}

export interface CreateStockEntryDto {
  productId: number;
  entryType: StockEntryType;
  quantity: number;
  unitCost?: number;
  referenceNo?: string;
  note?: string;
}
