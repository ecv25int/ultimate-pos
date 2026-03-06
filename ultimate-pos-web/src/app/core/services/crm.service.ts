import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CrmCampaign,
  CrmSchedule,
  CrmCallLog,
  CallLogsPage,
  CrmDashboard,
  CreateCampaignDto,
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateCallLogDto,
} from '../models/crm.model';

@Injectable({ providedIn: 'root' })
export class CrmService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/crm`;

  getDashboard(): Observable<CrmDashboard> {
    return this.http.get<CrmDashboard>(`${this.base}/dashboard`);
  }

  // Campaigns
  getCampaigns(): Observable<CrmCampaign[]> {
    return this.http.get<CrmCampaign[]>(`${this.base}/campaigns`);
  }

  createCampaign(dto: CreateCampaignDto): Observable<CrmCampaign> {
    return this.http.post<CrmCampaign>(`${this.base}/campaigns`, dto);
  }

  updateCampaignStatus(id: number, status: string): Observable<CrmCampaign> {
    return this.http.patch<CrmCampaign>(`${this.base}/campaigns/${id}/status`, { status });
  }

  deleteCampaign(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/campaigns/${id}`);
  }

  // Schedules
  getSchedules(filters?: { contactId?: number; status?: string; type?: string }): Observable<CrmSchedule[]> {
    let params = new HttpParams();
    if (filters?.contactId) params = params.set('contactId', String(filters.contactId));
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.type) params = params.set('type', filters.type);
    return this.http.get<CrmSchedule[]>(`${this.base}/schedules`, { params });
  }

  createSchedule(dto: CreateScheduleDto): Observable<CrmSchedule> {
    return this.http.post<CrmSchedule>(`${this.base}/schedules`, dto);
  }

  updateSchedule(id: number, dto: UpdateScheduleDto): Observable<CrmSchedule> {
    return this.http.patch<CrmSchedule>(`${this.base}/schedules/${id}`, dto);
  }

  deleteSchedule(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/schedules/${id}`);
  }

  // Call Logs
  getCallLogs(filters?: { contactId?: number; page?: number; limit?: number }): Observable<CallLogsPage> {
    let params = new HttpParams();
    if (filters?.contactId) params = params.set('contactId', String(filters.contactId));
    if (filters?.page) params = params.set('page', String(filters.page));
    if (filters?.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<CallLogsPage>(`${this.base}/call-logs`, { params });
  }

  createCallLog(dto: CreateCallLogDto): Observable<CrmCallLog> {
    return this.http.post<CrmCallLog>(`${this.base}/call-logs`, dto);
  }

  deleteCallLog(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/call-logs/${id}`);
  }
}
