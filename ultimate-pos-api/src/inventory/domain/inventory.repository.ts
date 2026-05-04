import type { StockEntry } from './stock-entry.entity';

export interface ProductStockInfo {
  id: number;
  name: string;
  sku: string;
  type: string;
  alertQuantity: number;
  currentStock: number;
  isLowStock: boolean;
  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
  unit: { id: number; actualName: string; shortName: string } | null;
}

export interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  adequateStock: number;
  totalStockValue: number;
}

export interface PaginatedEntries {
  data: StockEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateEntryData {
  productId: number;
  entryType: string;
  quantity: number;
  unitCost?: number;
  referenceNo?: string;
  note?: string;
}

export interface ProductInfo {
  id: number;
  name: string;
  enableStock: boolean;
  alertQuantity: number;
}

export interface IInventoryRepository {
  getStockLevel(productId: number, businessId: number): Promise<number>;
  getStockOverview(businessId: number, search?: string): Promise<ProductStockInfo[]>;
  getLowStockItems(businessId: number): Promise<ProductStockInfo[]>;
  getProductHistory(productId: number, businessId: number, limit: number): Promise<StockEntry[]>;
  getSummary(businessId: number): Promise<InventorySummary>;
  getAdjustments(businessId: number, page: number, limit: number, productId?: number): Promise<PaginatedEntries>;
  createEntry(businessId: number, userId: number, data: CreateEntryData): Promise<StockEntry>;
  deleteEntry(entryId: number, businessId: number): Promise<void>;
  findProduct(productId: number, businessId: number): Promise<ProductInfo | null>;
  findEntry(entryId: number, businessId: number): Promise<StockEntry | null>;
}

export const INVENTORY_REPOSITORY = Symbol('IInventoryRepository');
