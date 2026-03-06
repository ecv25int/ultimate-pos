import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RepairStatus,
  RepairDeviceModel,
  RepairJobSheet,
  RepairDashboard,
  CreateRepairStatusDto,
  CreateDeviceModelDto,
  CreateJobSheetDto,
  UpdateJobSheetDto,
} from '../models/repair.model';

@Injectable({ providedIn: 'root' })
export class RepairService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/repair`;

  getDashboard(): Observable<RepairDashboard> {
    return this.http.get<RepairDashboard>(`${this.base}/dashboard`);
  }

  // Statuses
  getStatuses(): Observable<RepairStatus[]> {
    return this.http.get<RepairStatus[]>(`${this.base}/statuses`);
  }

  createStatus(dto: CreateRepairStatusDto): Observable<RepairStatus> {
    return this.http.post<RepairStatus>(`${this.base}/statuses`, dto);
  }

  deleteStatus(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/statuses/${id}`);
  }

  // Device Models
  getDeviceModels(): Observable<RepairDeviceModel[]> {
    return this.http.get<RepairDeviceModel[]>(`${this.base}/device-models`);
  }

  createDeviceModel(dto: CreateDeviceModelDto): Observable<RepairDeviceModel> {
    return this.http.post<RepairDeviceModel>(`${this.base}/device-models`, dto);
  }

  deleteDeviceModel(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/device-models/${id}`);
  }

  // Job Sheets
  getJobSheets(filters?: { statusId?: number; contactId?: number }): Observable<RepairJobSheet[]> {
    let params = new HttpParams();
    if (filters?.statusId) params = params.set('statusId', String(filters.statusId));
    if (filters?.contactId) params = params.set('contactId', String(filters.contactId));
    return this.http.get<RepairJobSheet[]>(`${this.base}/job-sheets`, { params });
  }

  getJobSheet(id: number): Observable<RepairJobSheet> {
    return this.http.get<RepairJobSheet>(`${this.base}/job-sheets/${id}`);
  }

  createJobSheet(dto: CreateJobSheetDto): Observable<RepairJobSheet> {
    return this.http.post<RepairJobSheet>(`${this.base}/job-sheets`, dto);
  }

  updateJobSheet(id: number, dto: UpdateJobSheetDto): Observable<RepairJobSheet> {
    return this.http.patch<RepairJobSheet>(`${this.base}/job-sheets/${id}`, dto);
  }

  deleteJobSheet(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/job-sheets/${id}`);
  }
}
