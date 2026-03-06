import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StockOverviewItem,
  StockEntry,
  ProductStockHistory,
  InventorySummary,
  CreateStockEntryDto,
} from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private base = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<InventorySummary> {
    return this.http.get<InventorySummary>(`${this.base}/summary`);
  }

  getStockOverview(search?: string): Observable<StockOverviewItem[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<StockOverviewItem[]>(`${this.base}/stock`, { params });
  }

  getProductHistory(productId: number, limit = 50): Observable<ProductStockHistory> {
    return this.http.get<ProductStockHistory>(
      `${this.base}/stock/${productId}/history?limit=${limit}`
    );
  }

  createEntry(dto: CreateStockEntryDto): Observable<StockEntry> {
    return this.http.post<StockEntry>(`${this.base}/entries`, dto);
  }

  deleteEntry(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/entries/${id}`);
  }

  getAdjustments(opts: { page?: number; limit?: number; productId?: number } = {}): Observable<{
    data: StockEntry[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    let params = new HttpParams();
    if (opts.page) params = params.set('page', opts.page);
    if (opts.limit) params = params.set('limit', opts.limit);
    if (opts.productId) params = params.set('productId', opts.productId);
    return this.http.get<any>(`${this.base}/adjustments`, { params });
  }
}
