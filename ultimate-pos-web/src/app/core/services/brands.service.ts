import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Brand, CreateBrandDto } from '../models/brand.model';

@Injectable({ providedIn: 'root' })
export class BrandsService {
  private apiUrl = `${environment.apiUrl}/brands`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.apiUrl);
  }

  getById(id: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateBrandDto): Observable<Brand> {
    return this.http.post<Brand>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateBrandDto>): Observable<Brand> {
    return this.http.patch<Brand>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
