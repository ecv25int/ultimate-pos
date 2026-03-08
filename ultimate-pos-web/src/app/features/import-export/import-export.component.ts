import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { ImportExportService } from '../../core/services/import-export.service';
import { BarcodeService } from '../../core/services/barcode.service';
import { ImportResult } from '../../core/models/import-export.model';

@Component({
  selector: 'app-import-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatListModule,
  ],
  template: `
    <div class="ie-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">import_export</mat-icon>
          <div>
            <h1>Import &amp; Export</h1>
            <p class="subtitle">Bulk manage your data with CSV files</p>
          </div>
        </div>
      </div>

      <div class="content-grid">

        <!-- ── EXPORT SECTION ── -->
        <mat-card class="section-card">
          <mat-card-header>
            <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>download</mat-icon></div>
            <mat-card-title>Export Data</mat-card-title>
            <mat-card-subtitle>Download your data as CSV files</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="export-buttons">
              <button
                mat-raised-button
                color="primary"
                [disabled]="exportingProducts()"
                (click)="exportProducts()"
              >
                @if (exportingProducts()) {
                  <mat-spinner diameter="18" />
                } @else {
                  <mat-icon>inventory_2</mat-icon>
                }
                Export Products
              </button>

              <button
                mat-raised-button
                color="accent"
                [disabled]="exportingContacts()"
                (click)="exportContacts()"
              >
                @if (exportingContacts()) {
                  <mat-spinner diameter="18" />
                } @else {
                  <mat-icon>people</mat-icon>
                }
                Export Contacts
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- ── IMPORT SECTION ── -->
        <mat-card class="section-card">
          <mat-card-header>
            <div mat-card-avatar class="card-avatar-icon green"><mat-icon>upload</mat-icon></div>
            <mat-card-title>Import Products</mat-card-title>
            <mat-card-subtitle>Upload a CSV file to bulk-create products</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="template-hint">
              <mat-icon class="hint-icon">info</mat-icon>
              <div>
                <strong>Required CSV columns:</strong>
                <code>name, sku, unit_id</code>
                <br />
                <strong>Optional:</strong>
                <code>brand_id, category_id, barcode_type, enable_stock, alert_quantity</code>
              </div>
            </div>

            <div class="file-upload-area" (click)="fileInput.click()">
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <p>{{ importFile() ? importFile()!.name : 'Click to select CSV file' }}</p>
              <span class="file-hint">Accepts .csv files only</span>
              <input
                #fileInput
                type="file"
                accept=".csv,text/csv"
                style="display:none"
                (change)="onFileSelected($event)"
              />
            </div>

            @if (importFile()) {
              <div class="selected-file">
                <mat-icon>attach_file</mat-icon>
                <span>{{ importFile()!.name }}</span>
                <button mat-icon-button (click)="clearFile()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }

            <button
              mat-raised-button
              color="primary"
              class="import-btn"
              [disabled]="!importFile() || importing()"
              (click)="importProducts()"
            >
              @if (importing()) {
                <mat-spinner diameter="18" />
              } @else {
                <mat-icon>upload</mat-icon>
              }
              Import Products
            </button>

            <!-- Import Result -->
            @if (importResult()) {
              <div class="import-result" [class.has-errors]="importResult()!.errors.length > 0">
                <div class="result-summary">
                  <div class="result-stat success">
                    <mat-icon>check_circle</mat-icon>
                    <span>{{ importResult()!.created }} created</span>
                  </div>
                  <div class="result-stat warn">
                    <mat-icon>skip_next</mat-icon>
                    <span>{{ importResult()!.skipped }} skipped</span>
                  </div>
                </div>
                @if (importResult()!.errors.length > 0) {
                  <mat-divider />
                  <p class="errors-title">
                    <mat-icon>warning</mat-icon> Issues:
                  </p>
                  <ul class="error-list">
                    @for (err of importResult()!.errors; track err) {
                      <li>{{ err }}</li>
                    }
                  </ul>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- ── BARCODE GENERATOR ── -->
        <mat-card class="section-card barcode-card">
          <mat-card-header>
            <div mat-card-avatar class="card-avatar-icon purple"><mat-icon>qr_code</mat-icon></div>
            <mat-card-title>Barcode Generator</mat-card-title>
            <mat-card-subtitle>Preview and download barcodes for any text</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="barcode-form">
              <mat-form-field appearance="outline" class="barcode-input">
                <mat-label>Barcode text / SKU</mat-label>
                <input matInput [(ngModel)]="barcodeText" placeholder="e.g. ABC-001" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="barcode-type">
                <mat-label>Type</mat-label>
                <mat-select [(ngModel)]="barcodeType">
                  <mat-option value="C128">Code 128</mat-option>
                  <mat-option value="C39">Code 39</mat-option>
                  <mat-option value="EAN13">EAN-13</mat-option>
                  <mat-option value="EAN8">EAN-8</mat-option>
                  <mat-option value="QR">QR Code</mat-option>
                </mat-select>
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                [disabled]="!barcodeText || generatingBarcode()"
                (click)="generateBarcode()"
              >
                @if (generatingBarcode()) {
                  <mat-spinner diameter="18" />
                } @else {
                  <mat-icon>qr_code_scanner</mat-icon>
                }
                Generate
              </button>
            </div>

            @if (barcodeDataUrl()) {
              <div class="barcode-preview">
                <img [src]="barcodeDataUrl()" alt="Generated barcode" class="barcode-img" />
                <button mat-stroked-button color="primary" (click)="downloadBarcode()">
                  <mat-icon>download</mat-icon>
                  Download PNG
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .ie-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    .header-title { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .section-card { border-radius: 12px; overflow: hidden; height: fit-content; }
    .barcode-card { grid-column: 1 / -1; }

    /* Card header icon avatars — matches Products stat-icon pattern */
    .card-avatar-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
    }
    .card-avatar-icon.blue  { color: #1976d2; background: #e3f2fd; }
    .card-avatar-icon.green { color: #388e3c; background: #e8f5e9; }
    .card-avatar-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .card-avatar-icon mat-icon { font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }

    .export-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      padding-top: 8px;
    }
    .export-buttons button { gap: 6px; }

    .template-hint {
      display: flex;
      gap: 10px;
      background: #e8f5e9;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #2e7d32;
    }
    .hint-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; }
    code { background: rgba(0,0,0,0.05); border-radius: 4px; padding: 1px 4px; font-size: 12px; }

    .file-upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .file-upload-area:hover { border-color: #3f51b5; background: #f5f5ff; }
    .upload-icon { font-size: 40px; width: 40px; height: 40px; color: #999; display: block; margin: 0 auto 8px; }
    .file-hint { font-size: 12px; color: #999; }

    .selected-file {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 6px 10px;
      background: #f5f5f5;
      border-radius: 6px;
      font-size: 13px;
    }

    .import-btn { margin-top: 16px; gap: 6px; }

    .import-result {
      margin-top: 16px;
      border-radius: 8px;
      padding: 12px;
      background: #e8f5e9;
    }
    .import-result.has-errors { background: #fff3e0; }
    .result-summary { display: flex; gap: 16px; margin-bottom: 8px; }
    .result-stat { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; }
    .result-stat.success { color: #2e7d32; }
    .result-stat.warn { color: #e65100; }
    .errors-title { margin: 8px 0 4px; display: flex; align-items: center; gap: 4px; color: #e65100; font-weight: 500; }
    .error-list { margin: 0; padding-left: 20px; font-size: 13px; color: #555; }

    .barcode-form {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;
      padding-top: 8px;
    }
    .barcode-input { flex: 1; min-width: 180px; }
    .barcode-type { width: 140px; }
    .barcode-form button { margin-top: 4px; gap: 6px; }

    .barcode-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #eee;
    }
    .barcode-img { max-width: 100%; height: auto; }
  `],
})
export class ImportExportComponent {
  // Signals for loading states
  exportingProducts = signal(false);
  exportingContacts = signal(false);
  importing = signal(false);
  generatingBarcode = signal(false);

  // Import file
  importFile = signal<File | null>(null);
  importResult = signal<ImportResult | null>(null);

  // Barcode generator
  barcodeText = '';
  barcodeType = 'C128';
  barcodeDataUrl = signal<string | null>(null);
  private lastBarcodeBlob: Blob | null = null;

  constructor(
    private importExportService: ImportExportService,
    private barcodeService: BarcodeService,
    private snackBar: MatSnackBar,
  ) {}

  exportProducts() {
    this.exportingProducts.set(true);
    this.importExportService.exportProducts().subscribe({
      next: (blob) => {
        this.importExportService.downloadBlob(
          blob,
          `products-${new Date().toISOString().slice(0, 10)}.csv`,
        );
        this.exportingProducts.set(false);
        this.snackBar.open('Products exported successfully', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.exportingProducts.set(false);
        this.snackBar.open('Failed to export products', 'Dismiss', { duration: 4000 });
      },
    });
  }

  exportContacts() {
    this.exportingContacts.set(true);
    this.importExportService.exportContacts().subscribe({
      next: (blob) => {
        this.importExportService.downloadBlob(
          blob,
          `contacts-${new Date().toISOString().slice(0, 10)}.csv`,
        );
        this.exportingContacts.set(false);
        this.snackBar.open('Contacts exported successfully', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.exportingContacts.set(false);
        this.snackBar.open('Failed to export contacts', 'Dismiss', { duration: 4000 });
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importFile.set(input.files[0]);
      this.importResult.set(null);
    }
  }

  clearFile() {
    this.importFile.set(null);
    this.importResult.set(null);
  }

  importProducts() {
    const file = this.importFile();
    if (!file) return;
    this.importing.set(true);
    this.importExportService.importProducts(file).subscribe({
      next: (result) => {
        this.importing.set(false);
        this.importResult.set(result);
        this.snackBar.open(
          `Import complete: ${result.created} created, ${result.skipped} skipped`,
          'Dismiss',
          { duration: 5000 },
        );
      },
      error: (err) => {
        this.importing.set(false);
        const msg = err?.error?.message || 'Import failed';
        this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
      },
    });
  }

  generateBarcode() {
    if (!this.barcodeText) return;
    this.generatingBarcode.set(true);
    this.barcodeDataUrl.set(null);
    this.barcodeService.getBarcodeBlob(this.barcodeText, this.barcodeType).subscribe({
      next: async (blob) => {
        this.lastBarcodeBlob = blob;
        const url = await this.barcodeService.blobToDataUrl(blob);
        this.barcodeDataUrl.set(url);
        this.generatingBarcode.set(false);
      },
      error: () => {
        this.generatingBarcode.set(false);
        this.snackBar.open('Failed to generate barcode', 'Dismiss', { duration: 4000 });
      },
    });
  }

  downloadBarcode() {
    if (this.lastBarcodeBlob) {
      this.barcodeService.downloadBarcode(
        this.lastBarcodeBlob,
        `barcode-${this.barcodeText}.png`,
      );
    }
  }
}
