import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PosProduct, PosRecentTransaction, PosTransactionDto } from '../models/pos.model';
import { Sale } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class PosService {
  private apiUrl = `${environment.apiUrl}/pos`;

  constructor(private http: HttpClient) {}

  /**
   * Exact barcode / SKU lookup — used by hardware scanners.
   * Returns the matched product (with stock) or null.
   * GET /pos/products/scan?barcode=<barcode>
   */
  lookupBySku(barcode: string): Observable<PosProduct | null> {
    const params = new HttpParams().set('barcode', barcode);
    return this.http.get<PosProduct | null>(`${this.apiUrl}/products/scan`, { params });
  }

  /**
   * Search products for the POS product picker.
   * GET /pos/products?q=<query>
   */
  searchProducts(query?: string): Observable<PosProduct[]> {
    let params = new HttpParams();
    if (query) params = params.set('q', query);
    return this.http.get<PosProduct[]>(`${this.apiUrl}/products`, { params });
  }

  /**
   * Process a POS sale transaction.
   * POST /pos/transaction
   */
  processTransaction(dto: PosTransactionDto): Observable<Sale> {
    return this.http.post<Sale>(`${this.apiUrl}/transaction`, dto);
  }

  /**
   * Retrieve the last 50 POS transactions for this business.
   * GET /pos/recent
   */
  getRecentTransactions(): Observable<PosRecentTransaction[]> {
    return this.http.get<PosRecentTransaction[]>(`${this.apiUrl}/recent`);
  }

  /**
   * Send the ESC/POS open-drawer command.
   * Silently succeeds even when the drawer is not configured.
   * POST /pos/cash-drawer/open
   */
  openCashDrawer(): void {
    this.http.post(`${this.apiUrl}/cash-drawer/open`, {}).pipe(
      catchError(() => EMPTY),
    ).subscribe();
  }
}
