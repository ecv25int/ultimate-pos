import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTaxRateDto,
  SetGroupSubTaxesDto,
  TaxRate,
  TaxRateWithSubTaxes,
} from '../models/tax-rate.model';

@Injectable({ providedIn: 'root' })
export class TaxRatesService {
  private apiUrl = `${environment.apiUrl}/tax-rates`;

  constructor(private http: HttpClient) {}

  getAll(includeInactive = false): Observable<TaxRate[]> {
    let params = new HttpParams();
    if (includeInactive) params = params.set('includeInactive', 'true');
    return this.http.get<TaxRate[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<TaxRate> {
    return this.http.get<TaxRate>(`${this.apiUrl}/${id}`);
  }

  getWithSubTaxes(id: number): Observable<TaxRateWithSubTaxes> {
    return this.http.get<TaxRateWithSubTaxes>(`${this.apiUrl}/${id}/with-sub-taxes`);
  }

  create(dto: CreateTaxRateDto): Observable<TaxRate> {
    return this.http.post<TaxRate>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateTaxRateDto>): Observable<TaxRate> {
    return this.http.patch<TaxRate>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ─── Group Sub-Tax Methods ───────────────────────────────────────────────────

  /** Get all sub-taxes for a group tax rate */
  getSubTaxes(groupTaxId: number): Observable<TaxRate[]> {
    return this.http.get<TaxRate[]>(`${this.apiUrl}/${groupTaxId}/sub-taxes`);
  }

  /** Replace all sub-taxes for a group tax rate */
  setSubTaxes(groupTaxId: number, dto: SetGroupSubTaxesDto): Observable<TaxRate[]> {
    return this.http.put<TaxRate[]>(`${this.apiUrl}/${groupTaxId}/sub-taxes`, dto);
  }

  /** Add a single sub-tax to a group tax rate */
  addSubTax(groupTaxId: number, taxId: number): Observable<TaxRate[]> {
    return this.http.post<TaxRate[]>(`${this.apiUrl}/${groupTaxId}/sub-taxes/${taxId}`, {});
  }

  /** Remove a single sub-tax from a group tax rate */
  removeSubTax(groupTaxId: number, taxId: number): Observable<TaxRate[]> {
    return this.http.delete<TaxRate[]>(`${this.apiUrl}/${groupTaxId}/sub-taxes/${taxId}`);
  }
}
