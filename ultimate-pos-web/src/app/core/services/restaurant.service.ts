import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ResTable,
  Booking,
  RestaurantDashboard,
  CreateResTableDto,
  UpdateResTableDto,
  CreateBookingDto,
  UpdateBookingDto,
} from '../models/restaurant.model';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/restaurant`;

  getDashboard(): Observable<RestaurantDashboard> {
    return this.http.get<RestaurantDashboard>(`${this.base}/dashboard`);
  }

  // Tables
  getTables(): Observable<ResTable[]> {
    return this.http.get<ResTable[]>(`${this.base}/tables`);
  }

  createTable(dto: CreateResTableDto): Observable<ResTable> {
    return this.http.post<ResTable>(`${this.base}/tables`, dto);
  }

  updateTable(id: number, dto: UpdateResTableDto): Observable<ResTable> {
    return this.http.patch<ResTable>(`${this.base}/tables/${id}`, dto);
  }

  deleteTable(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/tables/${id}`);
  }

  // Bookings
  getBookings(filters?: { date?: string; status?: string; locationId?: number }): Observable<Booking[]> {
    let params = new HttpParams();
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.locationId) params = params.set('locationId', String(filters.locationId));
    return this.http.get<Booking[]>(`${this.base}/bookings`, { params });
  }

  createBooking(dto: CreateBookingDto): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings`, dto);
  }

  updateBooking(id: number, dto: UpdateBookingDto): Observable<Booking> {
    return this.http.patch<Booking>(`${this.base}/bookings/${id}`, dto);
  }

  deleteBooking(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/bookings/${id}`);
  }
}
