import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StockAdjustment,
  CreateStockAdjustmentDto,
} from '../models/stock-adjustment.model';

@Injectable({ providedIn: 'root' })
export class StockAdjustmentsService {
  private readonly apiUrl = `${environment.apiUrl}/stock-adjustments`;

  constructor(private http: HttpClient) {}

  getAll(locationId?: number): Observable<StockAdjustment[]> {
    let params = new HttpParams();
    if (locationId) params = params.set('locationId', locationId.toString());
    return this.http.get<StockAdjustment[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<StockAdjustment> {
    return this.http.get<StockAdjustment>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateStockAdjustmentDto): Observable<StockAdjustment> {
    return this.http.post<StockAdjustment>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateStockAdjustmentDto>): Observable<StockAdjustment> {
    return this.http.patch<StockAdjustment>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
