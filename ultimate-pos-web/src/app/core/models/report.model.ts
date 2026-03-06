export interface DashboardReport {
  totalSales: number;
  totalRevenue: number;
  totalPurchases: number;
  totalSpend: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface RevenuePoint {
  period: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: number;
  product?: { id: number; name: string; sku?: string };
  totalQty: number;
  totalRevenue: number;
}

export interface StockReportItem {
  id: number;
  name: string;
  sku?: string;
  currentStock: number;
  alertQuantity?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  unit?: { name: string; abbreviation: string };
  category?: { name: string };
}

export interface StockReport {
  products: StockReportItem[];
  totalValue: number;
  totalProducts: number;
}
