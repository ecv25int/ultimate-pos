export interface ExpenseCategory {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  businessId: number;
  expenseCategoryId?: number;
  refNo?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  note?: string;
  expenseDate: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  expenseCategory?: ExpenseCategory;
}

export interface ExpenseSummary {
  total: number;
  totalAmount: number;
  totalTax: number;
  topCategories: Array<{
    expenseCategoryId: number | null;
    _sum: { totalAmount: number | null };
    _count: number;
    categoryName?: string;
  }>;
}

export interface ExpenseListResponse {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateExpenseCategoryDto {
  name: string;
  description?: string;
}

export interface CreateExpenseDto {
  expenseCategoryId?: number;
  refNo?: string;
  amount: number;
  taxAmount?: number;
  note?: string;
  expenseDate?: string;
}
