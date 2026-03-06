import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLogEntry {
  id: number;
  businessId: number;
  userId?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  entity: string;
  entityId?: number;
  meta?: Record<string, any>;
  ip?: string;
  createdAt: string;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private base = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  getLogs(
    filters: {
      entity?: string;
      action?: string;
      userId?: number;
      page?: number;
      limit?: number;
    } = {},
  ): Observable<AuditLogResponse> {
    let params = new HttpParams();
    if (filters.entity) params = params.set('entity', filters.entity);
    if (filters.action) params = params.set('action', filters.action);
    if (filters.userId) params = params.set('userId', String(filters.userId));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<AuditLogResponse>(this.base, { params });
  }
}
