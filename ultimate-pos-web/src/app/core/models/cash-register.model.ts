export type CashRegisterStatus = 'open' | 'closed';
export type CashRegisterTransactionType =
  | 'cash_in'
  | 'cash_out'
  | 'sale'
  | 'refund'
  | 'opening'
  | 'closing';

export interface CashRegisterTransaction {
  id: number;
  cashRegisterId: number;
  transactionType: CashRegisterTransactionType;
  amount: number;
  note?: string;
  referenceNo?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CashRegister {
  id: number;
  businessId: number;
  userId: number;
  status: CashRegisterStatus;
  openingAmount: number;
  closingAmount?: number;
  openNote?: string;
  closingNote?: string;
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  transactions: CashRegisterTransaction[];
}

export interface CashRegisterSummary {
  openSessions: number;
  totalOpenFloat: number;
  totalCashIn: number;
  totalCashOut: number;
}

export interface CashRegisterListResponse {
  data: CashRegister[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCashRegisterDto {
  openingAmount: number;
  openNote?: string;
}

export interface AddTransactionDto {
  transactionType: 'cash_in' | 'cash_out' | 'sale' | 'refund';
  amount: number;
  note?: string;
  referenceNo?: string;
}

export interface CloseRegisterDto {
  closingAmount: number;
  closingNote?: string;
}
