import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warranty, CreateWarrantyDto } from '../models/warranty.model';

@Injectable({ providedIn: 'root' })
export class WarrantiesService {
  private apiUrl = `${environment.apiUrl}/warranties`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Warranty[]> {
    return this.http.get<Warranty[]>(this.apiUrl);
  }

  getById(id: number): Observable<Warranty> {
    return this.http.get<Warranty>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateWarrantyDto): Observable<Warranty> {
    return this.http.post<Warranty>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateWarrantyDto>): Observable<Warranty> {
    return this.http.patch<Warranty>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
