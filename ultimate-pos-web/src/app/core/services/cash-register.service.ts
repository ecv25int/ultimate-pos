import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddTransactionDto,
  CashRegister,
  CashRegisterListResponse,
  CashRegisterSummary,
  CashRegisterTransaction,
  CloseRegisterDto,
  CreateCashRegisterDto,
} from '../models/cash-register.model';

@Injectable({ providedIn: 'root' })
export class CashRegisterService {
  private apiUrl = `${environment.apiUrl}/cash-register`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<CashRegisterSummary> {
    return this.http.get<CashRegisterSummary>(`${this.apiUrl}/summary`);
  }

  getActiveSession(): Observable<CashRegister | null> {
    return this.http.get<CashRegister | null>(`${this.apiUrl}/active`);
  }

  openRegister(dto: CreateCashRegisterDto): Observable<CashRegister> {
    return this.http.post<CashRegister>(`${this.apiUrl}/open`, dto);
  }

  getAll(
    filters: { page?: number; limit?: number; status?: string } = {},
  ): Observable<CashRegisterListResponse> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<CashRegisterListResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<CashRegister> {
    return this.http.get<CashRegister>(`${this.apiUrl}/${id}`);
  }

  addTransaction(
    id: number,
    dto: AddTransactionDto,
  ): Observable<CashRegisterTransaction> {
    return this.http.post<CashRegisterTransaction>(
      `${this.apiUrl}/${id}/transaction`,
      dto,
    );
  }

  closeRegister(id: number, dto: CloseRegisterDto): Observable<CashRegister> {
    return this.http.post<CashRegister>(`${this.apiUrl}/${id}/close`, dto);
  }
}
