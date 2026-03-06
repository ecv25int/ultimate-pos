export interface AccountType {
  id: number;
  businessId: number;
  name: string;
  rootType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentAccountTypeId: number | null;
  children?: AccountType[];
  _count?: { accounts: number };
}

export interface Account {
  id: number;
  businessId: number;
  accountTypeId: number;
  accountType?: AccountType;
  name: string;
  accountNumber: string;
  note: string | null;
  isClosed: boolean;
  createdAt: string;
  balance?: number;
}

export interface AccountTransaction {
  id: number;
  accountId: number;
  account?: { id: number; name: string; accountNumber: string };
  type: 'debit' | 'credit';
  subType?: string;
  amount: string | number;
  referenceNo?: string;
  operationDate: string;
  note?: string;
  createdAt: string;
}

export interface AccountTransactionsPage {
  data: AccountTransaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TrialBalanceRow {
  id: number;
  accountNumber: string;
  name: string;
  accountType: string;
  rootType: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalance {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
}

export interface ProfitLossItem {
  id: number;
  name: string;
  balance: number;
}

export interface ProfitLoss {
  period: { start: string; end: string };
  revenue: ProfitLossItem[];
  totalRevenue: number;
  expenses: ProfitLossItem[];
  totalExpenses: number;
  netProfit: number;
}

export interface BalanceSheetItem {
  id: number;
  name: string;
  accountNumber: string;
  balance: number;
}

export interface BalanceSheet {
  assets: BalanceSheetItem[];
  totalAssets: number;
  liabilities: BalanceSheetItem[];
  totalLiabilities: number;
  equity: BalanceSheetItem[];
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

export interface CreateAccountTypeDto {
  name: string;
  rootType: string;
  parentAccountTypeId?: number;
}

export interface CreateAccountDto {
  accountTypeId: number;
  name: string;
  accountNumber: string;
  note?: string;
}

export interface CreateAccountTransactionDto {
  accountId: number;
  type: 'debit' | 'credit';
  subType?: string;
  amount: number;
  referenceNo?: string;
  operationDate: string;
  note?: string;
}
