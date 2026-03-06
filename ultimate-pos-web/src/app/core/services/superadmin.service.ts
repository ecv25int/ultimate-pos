import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Package, Subscription, SuperadminDashboard,
  CreatePackageDto, UpdatePackageDto, CreateSubscriptionDto,
} from '../models/superadmin.model';

@Injectable({ providedIn: 'root' })
export class SuperadminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/superadmin`;

  getDashboard(): Observable<SuperadminDashboard> { return this.http.get<SuperadminDashboard>(`${this.base}/dashboard`); }

  getPackages(): Observable<Package[]> { return this.http.get<Package[]>(`${this.base}/packages`); }
  getPackage(id: number): Observable<Package> { return this.http.get<Package>(`${this.base}/packages/${id}`); }
  createPackage(dto: CreatePackageDto): Observable<Package> { return this.http.post<Package>(`${this.base}/packages`, dto); }
  updatePackage(id: number, dto: UpdatePackageDto): Observable<Package> { return this.http.patch<Package>(`${this.base}/packages/${id}`, dto); }
  deletePackage(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/packages/${id}`); }

  getSubscriptions(businessId?: number): Observable<Subscription[]> {
    let params = new HttpParams();
    if (businessId) params = params.set('businessId', String(businessId));
    return this.http.get<Subscription[]>(`${this.base}/subscriptions`, { params });
  }

  createSubscription(dto: CreateSubscriptionDto): Observable<Subscription> { return this.http.post<Subscription>(`${this.base}/subscriptions`, dto); }
  updateSubscriptionStatus(id: number, status: string): Observable<Subscription> { return this.http.patch<Subscription>(`${this.base}/subscriptions/${id}/status`, { status }); }
  deleteSubscription(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/subscriptions/${id}`); }
}
