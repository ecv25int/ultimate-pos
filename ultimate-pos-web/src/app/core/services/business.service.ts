import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Business, CreateBusinessDto, BusinessLocation, CreateBusinessLocationDto } from '../models/business.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessService {
  private apiUrl = 'http://localhost:3000/api/business';

  constructor(private http: HttpClient) {}

  getAllBusinesses(): Observable<Business[]> {
    return this.http.get<Business[]>(this.apiUrl);
  }

  getMyBusiness(): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/my-business`);
  }

  getBusinessById(id: number): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/${id}`);
  }

  createBusiness(business: CreateBusinessDto): Observable<Business> {
    return this.http.post<Business>(this.apiUrl, business);
  }

  updateBusiness(id: number, business: Partial<CreateBusinessDto>): Observable<Business> {
    return this.http.patch<Business>(`${this.apiUrl}/${id}`, business);
  }

  deleteBusiness(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ─── Business Locations ───────────────────────────────────────────────────

  getLocations(): Observable<BusinessLocation[]> {
    return this.http.get<BusinessLocation[]>(`${this.apiUrl}/locations/list`);
  }

  getLocation(id: number): Observable<BusinessLocation> {
    return this.http.get<BusinessLocation>(`${this.apiUrl}/locations/${id}`);
  }

  createLocation(dto: CreateBusinessLocationDto): Observable<BusinessLocation> {
    return this.http.post<BusinessLocation>(`${this.apiUrl}/locations`, dto);
  }

  updateLocation(id: number, dto: Partial<CreateBusinessLocationDto>): Observable<BusinessLocation> {
    return this.http.patch<BusinessLocation>(`${this.apiUrl}/locations/${id}`, dto);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/locations/${id}`);
  }
}
