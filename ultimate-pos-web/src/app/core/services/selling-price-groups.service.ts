import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SellingPriceGroup, CreateSellingPriceGroupDto } from '../models/selling-price-group.model';

@Injectable({ providedIn: 'root' })
export class SellingPriceGroupsService {
  private apiUrl = `${environment.apiUrl}/selling-price-groups`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SellingPriceGroup[]> {
    return this.http.get<SellingPriceGroup[]>(this.apiUrl);
  }

  getById(id: number): Observable<SellingPriceGroup> {
    return this.http.get<SellingPriceGroup>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateSellingPriceGroupDto): Observable<SellingPriceGroup> {
    return this.http.post<SellingPriceGroup>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateSellingPriceGroupDto>): Observable<SellingPriceGroup> {
    return this.http.patch<SellingPriceGroup>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
