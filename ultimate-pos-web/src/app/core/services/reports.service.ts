import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardReport, RevenuePoint, TopProduct, StockReport } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardReport> {
    return this.http.get<DashboardReport>(`${this.apiUrl}/dashboard`);
  }

  getSalesReport(from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(`${this.apiUrl}/sales`, { params });
  }

  getPurchasesReport(from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(`${this.apiUrl}/purchases`, { params });
  }

  getStockReport(): Observable<StockReport> {
    return this.http.get<StockReport>(`${this.apiUrl}/stock`);
  }

  getTopProducts(limit = 10): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.apiUrl}/top-products?limit=${limit}`);
  }

  getRevenue(groupBy: 'day' | 'month' = 'day', days = 30): Observable<RevenuePoint[]> {
    return this.http.get<RevenuePoint[]>(
      `${this.apiUrl}/revenue?groupBy=${groupBy}&days=${days}`,
    );
  }

  getExpenseReport(from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(`${this.apiUrl}/expenses`, { params });
  }

  getTaxReport(from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(`${this.apiUrl}/tax`, { params });
  }

  getProfitLoss(from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(`${this.apiUrl}/profit-loss`, { params });
  }

  getCustomerReport(contactId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customer/${contactId}`);
  }

  getSupplierReport(contactId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/supplier/${contactId}`);
  }

  exportReport(type: 'sales' | 'purchases' | 'stock', from?: string, to?: string): void {
    let url = `${this.apiUrl}/export?type=${type}`;
    if (from) url += `&from=${from}`;
    if (to)   url += `&to=${to}`;
    window.open(url, '_blank');
  }

  exportReportPdf(type: 'sales' | 'purchases' | 'stock' | 'expenses' | 'profit-loss', from?: string, to?: string): void {
    let url = `${this.apiUrl}/export-pdf?type=${type}`;
    if (from) url += `&from=${from}`;
    if (to)   url += `&to=${to}`;
    window.open(url, '_blank');
  }
}
