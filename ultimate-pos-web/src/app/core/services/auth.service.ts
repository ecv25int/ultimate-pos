import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  businessId?: number;
}

export interface UpdateProfileDto {
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(dto: { email: string; password: string }): Observable<{ accessToken: string; refreshToken: string; user: UserProfile }> {
    return this.http.post<any>(`${this.base}/login`, dto);
  }

  register(dto: { email: string; password: string; username?: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/register`, dto);
  }

  forgotPassword(email: string): Observable<{ message: string; resetToken?: string }> {
    return this.http.post<any>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<any>(`${this.base}/reset-password`, { token, newPassword });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/profile`);
  }

  updateProfile(dto: UpdateProfileDto): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/profile`, dto);
  }

  changePassword(dto: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.post<any>(`${this.base}/change-password`, dto);
  }

  validateToken(): Observable<{ valid: boolean; user: UserProfile }> {
    return this.http.get<any>(`${this.base}/validate`);
  }

  refreshToken(refreshToken: string): Observable<{ accessToken: string }> {
    return this.http.post<any>(`${this.base}/refresh`, { refreshToken });
  }

  adminOnly(): Observable<any> {
    return this.http.get<any>(`${this.base}/admin-only`);
  }

  adminOrManager(): Observable<any> {
    return this.http.get<any>(`${this.base}/admin-or-manager`);
  }
}
