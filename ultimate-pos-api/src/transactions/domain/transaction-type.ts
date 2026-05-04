export const TRANSACTION_TYPES = [
  'sale',
  'purchase',
  'expense',
  'stock_transfer',
  'stock_adjustment',
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
