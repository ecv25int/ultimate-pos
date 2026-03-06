import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Contact,
  ContactListItem,
  CreateContactDto,
  UpdateContactDto,
} from '../models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contacts`;

  constructor(private http: HttpClient) {}

  getAll(params?: {
    type?: string;
    status?: string;
    search?: string;
  }): Observable<ContactListItem[]> {
    let httpParams = new HttpParams();
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<ContactListItem[]>(this.apiUrl, {
      params: httpParams,
    });
  }

  getOne(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateContactDto): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateContactDto): Observable<Contact> {
    return this.http.patch<Contact>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: number): Observable<Contact> {
    return this.http.patch<Contact>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  getLedger(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/ledger`);
  }

  getOverdueInvoices(id: number): Observable<{
    overdueSales: any[];
    overduePurchases: any[];
    totalSalesOwed: number;
    totalPurchasesOwed: number;
    overdueCount: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/${id}/overdue`);
  }

  importContacts(rows: any[]): Observable<{ created: number; skipped: number; total: number }> {
    return this.http.post<any>(`${this.apiUrl}/import`, { rows });
  }

  /**
   * GET /api/contacts/export — downloads all contacts as CSV Blob
   */
  exportContacts(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      responseType: 'blob',
    });
  }
}
