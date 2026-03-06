import { Sale } from './sale.model';
import { CreateSaleDto } from './sale.model';

/** Lightweight product shape returned by POS product search */
export interface PosProduct {
  id: number;
  name: string;
  sku: string;
  sellingPrice: number;
  currentStock: number;
  unit?: { shortName: string };
  category?: { name: string };
}

/** A recent POS transaction returned by /pos/recent */
export type PosRecentTransaction = Sale;

export type { CreateSaleDto as PosTransactionDto };
