import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceLayout {
  id: number;
  businessId: number;
  name: string;
  headerText?: string;
  footerText?: string;
  invoiceHeading?: string;
  invoiceNoLabel?: string;
  dateLabel?: string;
  dueDateLabel?: string;
  highlightColor?: string;
  subHeading1?: string;
  subHeading2?: string;
  subHeading3?: string;
  subHeading4?: string;
  subHeading5?: string;
  showBusinessName: boolean;
  showLocationName: boolean;
  showMobileNumber: boolean;
  showEmail: boolean;
  showTax1: boolean;
  showTax2: boolean;
  showTaxTotal: boolean;
  showLogo: boolean;
  showBarcode: boolean;
  showPaymentMethods: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceScheme {
  id: number;
  businessId: number;
  name: string;
  schemeType: string;
  prefix?: string;
  invoiceLayoutId?: number;
  startNumber: number;
  totalDigits: number;
  isDefault: boolean;
  invoiceCount: number;
  invoiceLayout?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export type CreateInvoiceLayoutDto = Omit<InvoiceLayout, 'id' | 'businessId' | 'invoiceCount' | 'createdAt' | 'updatedAt'>;
export type CreateInvoiceSchemeDto = Omit<InvoiceScheme, 'id' | 'businessId' | 'invoiceCount' | 'invoiceLayout' | 'createdAt' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class InvoiceSettingsService {
  private baseUrl = 'http://localhost:3000/api/documents';

  constructor(private http: HttpClient) {}

  // ── Layouts ──────────────────────────────────────────────────────────────
  getLayouts(): Observable<InvoiceLayout[]> {
    return this.http.get<InvoiceLayout[]>(`${this.baseUrl}/invoice-layouts`);
  }

  createLayout(dto: Partial<CreateInvoiceLayoutDto>): Observable<InvoiceLayout> {
    return this.http.post<InvoiceLayout>(`${this.baseUrl}/invoice-layouts`, dto);
  }

  updateLayout(id: number, dto: Partial<CreateInvoiceLayoutDto>): Observable<InvoiceLayout> {
    return this.http.patch<InvoiceLayout>(`${this.baseUrl}/invoice-layouts/${id}`, dto);
  }

  deleteLayout(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/invoice-layouts/${id}`);
  }

  // ── Schemes ──────────────────────────────────────────────────────────────
  getSchemes(): Observable<InvoiceScheme[]> {
    return this.http.get<InvoiceScheme[]>(`${this.baseUrl}/invoice-schemes`);
  }

  createScheme(dto: Partial<CreateInvoiceSchemeDto>): Observable<InvoiceScheme> {
    return this.http.post<InvoiceScheme>(`${this.baseUrl}/invoice-schemes`, dto);
  }

  updateScheme(id: number, dto: Partial<CreateInvoiceSchemeDto>): Observable<InvoiceScheme> {
    return this.http.patch<InvoiceScheme>(`${this.baseUrl}/invoice-schemes/${id}`, dto);
  }

  deleteScheme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/invoice-schemes/${id}`);
  }
}
