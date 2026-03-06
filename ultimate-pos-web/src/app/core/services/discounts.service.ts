import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Discount, CreateDiscountDto } from '../models/discount.model';

@Injectable({ providedIn: 'root' })
export class DiscountsService {
  private apiUrl = `${environment.apiUrl}/discounts`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Discount[]> {
    return this.http.get<Discount[]>(this.apiUrl);
  }

  getById(id: number): Observable<Discount> {
    return this.http.get<Discount>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateDiscountDto): Observable<Discount> {
    return this.http.post<Discount>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateDiscountDto>): Observable<Discount> {
    return this.http.patch<Discount>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
