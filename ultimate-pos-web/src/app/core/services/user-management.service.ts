import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateUserDto,
  StaffUser,
  UpdateUserDto,
  UserListResponse,
  UserSummary,
} from '../models/user-management.model';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<UserSummary> {
    return this.http.get<UserSummary>(`${this.apiUrl}/summary`);
  }

  getAll(
    filters: {
      search?: string;
      userType?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Observable<UserListResponse> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.userType) params = params.set('userType', filters.userType);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<UserListResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<StaffUser> {
    return this.http.get<StaffUser>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateUserDto): Observable<StaffUser> {
    return this.http.post<StaffUser>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateUserDto): Observable<StaffUser> {
    return this.http.patch<StaffUser>(`${this.apiUrl}/${id}`, dto);
  }

  changePassword(
    id: number,
    newPassword: string,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/${id}/change-password`,
      { newPassword },
    );
  }

  toggleActive(id: number): Observable<StaffUser> {
    return this.http.post<StaffUser>(
      `${this.apiUrl}/${id}/toggle-active`,
      {},
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
