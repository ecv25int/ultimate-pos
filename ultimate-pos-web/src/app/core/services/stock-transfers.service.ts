import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockTransfer, CreateStockTransferDto, StockTransferStatus } from '../models/stock-transfer.model';

@Injectable({ providedIn: 'root' })
export class StockTransfersService {
  private base = `${environment.apiUrl}/stock-transfers`;

  constructor(private http: HttpClient) {}

  getAll(opts: {
    page?: number;
    limit?: number;
    productId?: number;
    status?: StockTransferStatus;
  } = {}): Observable<{ data: StockTransfer[]; total: number; page: number; lastPage: number }> {
    let params = new HttpParams();
    if (opts.page) params = params.set('page', opts.page);
    if (opts.limit) params = params.set('limit', opts.limit);
    if (opts.productId) params = params.set('productId', opts.productId);
    if (opts.status) params = params.set('status', opts.status);
    return this.http.get<any>(this.base, { params });
  }

  getById(id: number): Observable<StockTransfer> {
    return this.http.get<StockTransfer>(`${this.base}/${id}`);
  }

  create(dto: CreateStockTransferDto): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(this.base, dto);
  }

  updateStatus(id: number, status: StockTransferStatus): Observable<StockTransfer> {
    return this.http.patch<StockTransfer>(`${this.base}/${id}/status`, { status });
  }
}
