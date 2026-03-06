import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WoocommerceSyncLog, WoocommerceStats, CreateSyncLogDto } from '../models/woocommerce.model';

@Injectable({ providedIn: 'root' })
export class WoocommerceService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/woocommerce`;

  getStats(): Observable<WoocommerceStats> { return this.http.get<WoocommerceStats>(`${this.base}/stats`); }

  getSyncLogs(syncType?: string): Observable<WoocommerceSyncLog[]> {
    let params = new HttpParams();
    if (syncType) params = params.set('syncType', syncType);
    return this.http.get<WoocommerceSyncLog[]>(`${this.base}/sync-logs`, { params });
  }

  createSyncLog(dto: CreateSyncLogDto): Observable<WoocommerceSyncLog> { return this.http.post<WoocommerceSyncLog>(`${this.base}/sync-logs`, dto); }
  clearSyncLogs(): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/sync-logs`); }
}
