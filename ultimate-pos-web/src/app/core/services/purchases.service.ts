import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Purchase,
  PurchaseListResponse,
  PurchaseSummary,
  CreatePurchaseDto,
} from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private apiUrl = `${environment.apiUrl}/purchases`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<PurchaseSummary> {
    return this.http.get<PurchaseSummary>(`${this.apiUrl}/summary`);
  }

  getAll(filters: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    type?: string;
    contactId?: number;
    page?: number;
    limit?: number;
  } = {}): Observable<PurchaseListResponse> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.paymentStatus) params = params.set('paymentStatus', filters.paymentStatus);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.contactId) params = params.set('contactId', String(filters.contactId));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<PurchaseListResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreatePurchaseDto): Observable<Purchase> {
    return this.http.post<Purchase>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreatePurchaseDto>): Observable<Purchase> {
    return this.http.patch<Purchase>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createReturn(
    id: number,
    dto: { lines: { productId: number; quantity: number; unitCost: number }[]; note?: string },
  ): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.apiUrl}/${id}/return`, dto);
  }

  convertToOrder(id: number): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.apiUrl}/${id}/convert-to-order`, {});
  }
}
