import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccountType,
  Account,
  AccountTransaction,
  AccountTransactionsPage,
  TrialBalance,
  ProfitLoss,
  BalanceSheet,
  CreateAccountTypeDto,
  CreateAccountDto,
  CreateAccountTransactionDto,
} from '../models/accounting.model';

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/accounting`;

  // Account Types
  getAccountTypes(): Observable<AccountType[]> {
    return this.http.get<AccountType[]>(`${this.base}/account-types`);
  }

  createAccountType(dto: CreateAccountTypeDto): Observable<AccountType> {
    return this.http.post<AccountType>(`${this.base}/account-types`, dto);
  }

  deleteAccountType(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/account-types/${id}`);
  }

  // Accounts
  getAccounts(includeBalance = false): Observable<Account[]> {
    const params = includeBalance ? new HttpParams().set('includeBalance', 'true') : new HttpParams();
    return this.http.get<Account[]>(`${this.base}/accounts`, { params });
  }

  getAccount(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.base}/accounts/${id}`);
  }

  createAccount(dto: CreateAccountDto): Observable<Account> {
    return this.http.post<Account>(`${this.base}/accounts`, dto);
  }

  updateAccount(id: number, dto: Partial<CreateAccountDto & { isClosed: boolean }>): Observable<Account> {
    return this.http.patch<Account>(`${this.base}/accounts/${id}`, dto);
  }

  deleteAccount(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/accounts/${id}`);
  }

  // Transactions
  getTransactions(filters: {
    accountId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Observable<AccountTransactionsPage> {
    let params = new HttpParams();
    if (filters.accountId) params = params.set('accountId', filters.accountId.toString());
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    return this.http.get<AccountTransactionsPage>(`${this.base}/transactions`, { params });
  }

  createTransaction(dto: CreateAccountTransactionDto): Observable<AccountTransaction> {
    return this.http.post<AccountTransaction>(`${this.base}/transactions`, dto);
  }

  deleteTransaction(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/transactions/${id}`);
  }

  // Reports
  getTrialBalance(): Observable<TrialBalance> {
    return this.http.get<TrialBalance>(`${this.base}/reports/trial-balance`);
  }

  getProfitLoss(startDate?: string, endDate?: string): Observable<ProfitLoss> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ProfitLoss>(`${this.base}/reports/profit-loss`, { params });
  }

  getBalanceSheet(): Observable<BalanceSheet> {
    return this.http.get<BalanceSheet>(`${this.base}/reports/balance-sheet`);
  }
}
