import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EssentialsLeaveType, EssentialsLeave, EssentialsPayroll,
  EssentialsDocument, EssentialsReminder, EssentialsDashboard,
  CreateLeaveTypeDto, CreateLeaveDto, UpdateLeaveStatusDto,
  CreatePayrollDto, CreateDocumentDto, CreateReminderDto,
} from '../models/essentials.model';

@Injectable({ providedIn: 'root' })
export class EssentialsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/essentials`;

  getDashboard(): Observable<EssentialsDashboard> { return this.http.get<EssentialsDashboard>(`${this.base}/dashboard`); }

  getLeaveTypes(): Observable<EssentialsLeaveType[]> { return this.http.get<EssentialsLeaveType[]>(`${this.base}/leave-types`); }
  createLeaveType(dto: CreateLeaveTypeDto): Observable<EssentialsLeaveType> { return this.http.post<EssentialsLeaveType>(`${this.base}/leave-types`, dto); }
  deleteLeaveType(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/leave-types/${id}`); }

  getLeaves(filters?: { userId?: number; status?: string }): Observable<EssentialsLeave[]> {
    let params = new HttpParams();
    if (filters?.userId) params = params.set('userId', String(filters.userId));
    if (filters?.status) params = params.set('status', filters.status);
    return this.http.get<EssentialsLeave[]>(`${this.base}/leaves`, { params });
  }

  createLeave(dto: CreateLeaveDto): Observable<EssentialsLeave> { return this.http.post<EssentialsLeave>(`${this.base}/leaves`, dto); }
  updateLeaveStatus(id: number, dto: UpdateLeaveStatusDto): Observable<EssentialsLeave> { return this.http.patch<EssentialsLeave>(`${this.base}/leaves/${id}/status`, dto); }
  deleteLeave(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/leaves/${id}`); }

  getPayrolls(userId?: number): Observable<EssentialsPayroll[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', String(userId));
    return this.http.get<EssentialsPayroll[]>(`${this.base}/payrolls`, { params });
  }

  createPayroll(dto: CreatePayrollDto): Observable<EssentialsPayroll> { return this.http.post<EssentialsPayroll>(`${this.base}/payrolls`, dto); }
  deletePayroll(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/payrolls/${id}`); }

  getDocuments(userId?: number): Observable<EssentialsDocument[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', String(userId));
    return this.http.get<EssentialsDocument[]>(`${this.base}/documents`, { params });
  }

  createDocument(dto: CreateDocumentDto): Observable<EssentialsDocument> { return this.http.post<EssentialsDocument>(`${this.base}/documents`, dto); }
  deleteDocument(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/documents/${id}`); }

  getReminders(): Observable<EssentialsReminder[]> { return this.http.get<EssentialsReminder[]>(`${this.base}/reminders`); }
  createReminder(dto: CreateReminderDto): Observable<EssentialsReminder> { return this.http.post<EssentialsReminder>(`${this.base}/reminders`, dto); }
  deleteReminder(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/reminders/${id}`); }
}
