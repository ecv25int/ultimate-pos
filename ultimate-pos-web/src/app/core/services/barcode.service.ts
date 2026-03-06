import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BarcodeLabel,
  CreateBarcodeLabelDto,
  BarcodeGenerateResult,
} from '../models/stock-adjustment.model';

@Injectable({ providedIn: 'root' })
export class BarcodeService {
  private readonly apiUrl = environment.apiUrl;
  private readonly labelsUrl = `${environment.apiUrl}/barcode/labels`;

  constructor(private http: HttpClient) {}

  /**
   * Get barcode PNG as a Blob for a product by its ID
   */
  getProductBarcodeBlob(productId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/documents/barcode/product/${productId}`,
      { responseType: 'blob' },
    );
  }

  /**
   * Get barcode PNG as a Blob for arbitrary text
   */
  getBarcodeBlob(text: string, type = 'C128'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documents/barcode`, {
      params: { text, type },
      responseType: 'blob',
    });
  }

  /**
   * Trigger browser download of a barcode PNG
   */
  downloadBarcode(blob: Blob, filename = 'barcode.png'): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Convert a Blob to a data URL for display in <img> tags
   */
  blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ── Barcode Label Templates ─────────────────────────────────────────────────

  getAllLabels(): Observable<BarcodeLabel[]> {
    return this.http.get<BarcodeLabel[]>(this.labelsUrl);
  }

  getLabelById(id: number): Observable<BarcodeLabel> {
    return this.http.get<BarcodeLabel>(`${this.labelsUrl}/${id}`);
  }

  createLabel(dto: CreateBarcodeLabelDto): Observable<BarcodeLabel> {
    return this.http.post<BarcodeLabel>(this.labelsUrl, dto);
  }

  updateLabel(id: number, dto: Partial<CreateBarcodeLabelDto>): Observable<BarcodeLabel> {
    return this.http.patch<BarcodeLabel>(`${this.labelsUrl}/${id}`, dto);
  }

  deleteLabel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.labelsUrl}/${id}`);
  }

  /**
   * GET /barcode/generate?productId=X&labelId=Y
   * Returns variation barcodes + label config for rendering/printing client-side
   */
  generateForProduct(productId: number, labelId?: number): Observable<BarcodeGenerateResult> {
    let params = new HttpParams().set('productId', productId.toString());
    if (labelId) params = params.set('labelId', labelId.toString());
    return this.http.get<BarcodeGenerateResult>(`${this.apiUrl}/barcode/generate`, { params });
  }
}
