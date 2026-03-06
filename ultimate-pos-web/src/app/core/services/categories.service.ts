import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CreateCategoryDto } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(parentId?: number): Observable<Category[]> {
    let params = new HttpParams();
    if (parentId !== undefined) params = params.set('parentId', parentId);
    return this.http.get<Category[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateCategoryDto>): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
