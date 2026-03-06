import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Unit, CreateUnitDto } from '../models/unit.model';

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private apiUrl = `${environment.apiUrl}/units`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Unit[]> {
    return this.http.get<Unit[]>(this.apiUrl);
  }

  getById(id: number): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateUnitDto): Observable<Unit> {
    return this.http.post<Unit>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateUnitDto>): Observable<Unit> {
    return this.http.patch<Unit>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
