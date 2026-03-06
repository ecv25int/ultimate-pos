import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Expense,
  ExpenseCategory,
  ExpenseListResponse,
  ExpenseSummary,
  CreateExpenseCategoryDto,
  CreateExpenseDto,
} from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ExpenseSummary> {
    return this.http.get<ExpenseSummary>(`${this.apiUrl}/summary`);
  }

  // Categories
  getCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(`${this.apiUrl}/categories`);
  }

  createCategory(dto: CreateExpenseCategoryDto): Observable<ExpenseCategory> {
    return this.http.post<ExpenseCategory>(`${this.apiUrl}/categories`, dto);
  }

  updateCategory(
    id: number,
    dto: Partial<CreateExpenseCategoryDto>,
  ): Observable<ExpenseCategory> {
    return this.http.patch<ExpenseCategory>(
      `${this.apiUrl}/categories/${id}`,
      dto,
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // Expenses
  getAll(
    filters: {
      search?: string;
      categoryId?: number;
      page?: number;
      limit?: number;
    } = {},
  ): Observable<ExpenseListResponse> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.categoryId)
      params = params.set('categoryId', String(filters.categoryId));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<ExpenseListResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateExpenseDto>): Observable<Expense> {
    return this.http.patch<Expense>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
