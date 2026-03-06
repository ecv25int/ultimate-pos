import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImportResult } from '../models/import-export.model';

@Injectable({ providedIn: 'root' })
export class ImportExportService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Export products as CSV — returns a Blob
   */
  exportProducts(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/products/export`, {
      responseType: 'blob',
    });
  }

  /**
   * Export contacts as CSV — returns a Blob
   */
  exportContacts(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/contacts/export`, {
      responseType: 'blob',
    });
  }

  /**
   * Import products from CSV file
   */
  importProducts(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.apiUrl}/products/import`, formData);
  }

  /**
   * Download the CSV import template for an entity
   * GET /import-export/template?entity=products|contacts
   */
  downloadTemplate(entity: 'products' | 'contacts'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/import-export/template`, {
      params: { entity },
      responseType: 'blob',
    });
  }

  /**
   * Preview CSV rows before importing (validation without committing)
   * POST /import-export/import/preview
   */
  previewImport(
    entity: 'products' | 'contacts',
    rows: Record<string, unknown>[],
  ): Observable<{ valid: Record<string, unknown>[]; errors: { row: number; message: string }[] }> {
    return this.http.post<any>(`${this.apiUrl}/import-export/import/preview`, { entity, rows });
  }

  /**
   * Commit validated rows to the database
   * POST /import-export/import/commit
   */
  commitImport(
    entity: 'products' | 'contacts',
    rows: Record<string, unknown>[],
  ): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.apiUrl}/import-export/import/commit`, { entity, rows });
  }

  /**
   * Trigger browser download of a Blob
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
