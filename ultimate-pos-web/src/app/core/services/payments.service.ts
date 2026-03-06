import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, CreatePaymentDto, BulkPaymentDto } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private base = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getAll(opts: {
    page?: number;
    limit?: number;
    saleId?: number;
    purchaseId?: number;
    method?: string;
  } = {}): Observable<{ data: Payment[]; total: number; page: number; lastPage: number }> {
    let params = new HttpParams();
    if (opts.page) params = params.set('page', opts.page);
    if (opts.limit) params = params.set('limit', opts.limit);
    if (opts.saleId) params = params.set('saleId', opts.saleId);
    if (opts.purchaseId) params = params.set('purchaseId', opts.purchaseId);
    if (opts.method) params = params.set('method', opts.method);
    return this.http.get<any>(this.base, { params });
  }

  getById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.base}/${id}`);
  }

  create(dto: CreatePaymentDto): Observable<Payment> {
    return this.http.post<Payment>(this.base, dto);
  }

  createBulk(dto: BulkPaymentDto): Observable<{ created: number; payments: Payment[] }> {
    return this.http.post<{ created: number; payments: Payment[] }>(`${this.base}/bulk`, dto);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
