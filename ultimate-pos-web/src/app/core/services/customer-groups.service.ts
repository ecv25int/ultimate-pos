import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerGroup, CreateCustomerGroupDto } from '../models/customer-group.model';

@Injectable({ providedIn: 'root' })
export class CustomerGroupsService {
  private apiUrl = `${environment.apiUrl}/customer-groups`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CustomerGroup[]> {
    return this.http.get<CustomerGroup[]>(this.apiUrl);
  }

  getById(id: number): Observable<CustomerGroup> {
    return this.http.get<CustomerGroup>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCustomerGroupDto): Observable<CustomerGroup> {
    return this.http.post<CustomerGroup>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateCustomerGroupDto>): Observable<CustomerGroup> {
    return this.http.patch<CustomerGroup>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
