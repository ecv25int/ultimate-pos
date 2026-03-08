import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InvoiceLayout {
  id: number;
  name: string;
  businessId: number;
  headerText?: string;
  footerText?: string;
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showTax: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceLayoutDto {
  name: string;
  headerText?: string;
  footerText?: string;
  showLogo?: boolean;
  showAddress?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showTax?: boolean;
  isDefault?: boolean;
}

export interface InvoiceScheme {
  id: number;
  name: string;
  businessId: number;
  prefix: string;
  startingNumber: number;
  totalDigits: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceSchemeDto {
  name: string;
  prefix: string;
  startingNumber?: number;
  totalDigits?: number;
  isDefault?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly base = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  /** GET /api/documents/receipt/:saleId — fetches receipt HTML with auth headers */
  getReceiptHtml(saleId: number): Observable<string> {
    return this.http.get(`${this.base}/receipt/${saleId}`, { responseType: 'text' });
  }

  /** GET /api/documents/invoice/:saleId — invoice data for printing */
  getInvoiceData(saleId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/invoice/${saleId}`);
  }

  /** GET /api/documents/barcode?text=&type= — barcode image URL (returns blob URL from httpClient) */
  getBarcodeUrl(text: string, type = 'C128'): string {
    return `${this.base}/barcode?text=${encodeURIComponent(text)}&type=${type}`;
  }

  /** GET /api/documents/barcode/product/:id — barcode image URL for product */
  getProductBarcodeUrl(productId: number): string {
    return `${this.base}/barcode/product/${productId}`;
  }

  // ─── Invoice Layouts ────────────────────────────────────────────────────────

  getInvoiceLayouts(): Observable<InvoiceLayout[]> {
    return this.http.get<InvoiceLayout[]>(`${this.base}/invoice-layouts`);
  }

  getInvoiceLayout(id: number): Observable<InvoiceLayout> {
    return this.http.get<InvoiceLayout>(`${this.base}/invoice-layouts/${id}`);
  }

  createInvoiceLayout(dto: CreateInvoiceLayoutDto): Observable<InvoiceLayout> {
    return this.http.post<InvoiceLayout>(`${this.base}/invoice-layouts`, dto);
  }

  updateInvoiceLayout(id: number, dto: Partial<CreateInvoiceLayoutDto>): Observable<InvoiceLayout> {
    return this.http.patch<InvoiceLayout>(`${this.base}/invoice-layouts/${id}`, dto);
  }

  deleteInvoiceLayout(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/invoice-layouts/${id}`);
  }

  // ─── Invoice Schemes ────────────────────────────────────────────────────────

  getInvoiceSchemes(): Observable<InvoiceScheme[]> {
    return this.http.get<InvoiceScheme[]>(`${this.base}/invoice-schemes`);
  }

  getInvoiceScheme(id: number): Observable<InvoiceScheme> {
    return this.http.get<InvoiceScheme>(`${this.base}/invoice-schemes/${id}`);
  }

  createInvoiceScheme(dto: CreateInvoiceSchemeDto): Observable<InvoiceScheme> {
    return this.http.post<InvoiceScheme>(`${this.base}/invoice-schemes`, dto);
  }

  updateInvoiceScheme(id: number, dto: Partial<CreateInvoiceSchemeDto>): Observable<InvoiceScheme> {
    return this.http.patch<InvoiceScheme>(`${this.base}/invoice-schemes/${id}`, dto);
  }

  deleteInvoiceScheme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/invoice-schemes/${id}`);
  }
}
