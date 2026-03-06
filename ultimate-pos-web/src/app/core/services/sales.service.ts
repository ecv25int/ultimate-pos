import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Sale,
  SaleListResponse,
  SaleSummary,
  CreateSaleDto,
} from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly base = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<SaleSummary> {
    return this.http.get<SaleSummary>(`${this.base}/summary`);
  }

  getSales(opts: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    contactId?: number;
    type?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<SaleListResponse> {
    let params = new HttpParams();
    if (opts.search) params = params.set('search', opts.search);
    if (opts.status) params = params.set('status', opts.status);
    if (opts.paymentStatus) params = params.set('paymentStatus', opts.paymentStatus);
    if (opts.contactId) params = params.set('contactId', String(opts.contactId));
    if (opts.type) params = params.set('type', opts.type);
    if (opts.page) params = params.set('page', String(opts.page));
    if (opts.limit) params = params.set('limit', String(opts.limit));
    return this.http.get<SaleListResponse>(this.base, { params });
  }

  getSaleById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.base}/${id}`);
  }

  createSale(dto: CreateSaleDto): Observable<Sale> {
    return this.http.post<Sale>(this.base, dto);
  }

  updateSale(id: number, dto: Partial<CreateSaleDto>): Observable<Sale> {
    return this.http.patch<Sale>(`${this.base}/${id}`, dto);
  }

  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  convertToInvoice(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/convert-to-invoice`, {});
  }

  createReturn(
    id: number,
    dto: { lines: { productId: number; quantity: number; unitPrice: number }[]; note?: string },
  ): Observable<Sale> {
    return this.http.post<Sale>(`${this.base}/${id}/return`, dto);
  }

  getInvoice(saleId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/documents/invoice/${saleId}`);
  }
}
