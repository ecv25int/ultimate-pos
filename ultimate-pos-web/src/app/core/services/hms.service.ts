import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  HmsRoomType, HmsRoom, HmsExtra, HmsBookingLine, HmsDashboard,
  CreateRoomTypeDto, CreateRoomDto, CreateExtraDto, CreateBookingLineDto,
} from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class HmsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/hms`;

  getDashboard(): Observable<HmsDashboard> { return this.http.get<HmsDashboard>(`${this.base}/dashboard`); }

  getRoomTypes(): Observable<HmsRoomType[]> { return this.http.get<HmsRoomType[]>(`${this.base}/room-types`); }
  createRoomType(dto: CreateRoomTypeDto): Observable<HmsRoomType> { return this.http.post<HmsRoomType>(`${this.base}/room-types`, dto); }
  deleteRoomType(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/room-types/${id}`); }

  getRooms(roomTypeId?: number): Observable<HmsRoom[]> {
    let params = new HttpParams();
    if (roomTypeId) params = params.set('roomTypeId', String(roomTypeId));
    return this.http.get<HmsRoom[]>(`${this.base}/rooms`, { params });
  }

  createRoom(dto: CreateRoomDto): Observable<HmsRoom> { return this.http.post<HmsRoom>(`${this.base}/rooms`, dto); }
  deleteRoom(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/rooms/${id}`); }

  getExtras(): Observable<HmsExtra[]> { return this.http.get<HmsExtra[]>(`${this.base}/extras`); }
  createExtra(dto: CreateExtraDto): Observable<HmsExtra> { return this.http.post<HmsExtra>(`${this.base}/extras`, dto); }
  deleteExtra(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/extras/${id}`); }

  getBookingLines(transactionId: number): Observable<HmsBookingLine[]> { return this.http.get<HmsBookingLine[]>(`${this.base}/booking-lines/${transactionId}`); }
  createBookingLine(dto: CreateBookingLineDto): Observable<HmsBookingLine> { return this.http.post<HmsBookingLine>(`${this.base}/booking-lines`, dto); }
}
