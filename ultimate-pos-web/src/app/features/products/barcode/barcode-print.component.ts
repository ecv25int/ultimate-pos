import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ProductService } from '../../../core/services/product.service';
import { BarcodeService } from '../../../core/services/barcode.service';
import { BarcodeLabel } from '../../../core/models/stock-adjustment.model';

interface BarcodeItem {
  productId: number;
  name: string;
  sku: string;
  barcode: string;
  selected: boolean;
  qty: number;
  imageUrl: SafeUrl | null;
  loading: boolean;
}

@Component({
  selector: 'app-barcode-print',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Barcode Labels</h1>
          <p class="subtitle">Generate and print product barcode labels</p>
        </div>
        <div style="display:flex;gap:8px">
          <button mat-stroked-button (click)="selectAll()" [disabled]="!items.length">
            Select All
          </button>
          <button mat-flat-button color="primary" (click)="printSelected()"
            [disabled]="!selectedItems.length">
            <mat-icon>print</mat-icon>
            Print ({{ selectedItems.length }})
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search products</mat-label>
          <input matInput [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Name or SKU…">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:180px">
          <mat-label>Label size</mat-label>
          <mat-select [(ngModel)]="labelSize">
            <mat-option value="small">Small (2cm × 1cm)</mat-option>
            <mat-option value="medium">Medium (4cm × 2cm)</mat-option>
            <mat-option value="large">Large (6cm × 3cm)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:220px" *ngIf="storedLabels.length > 0">
          <mat-label>Saved template</mat-label>
          <mat-select [(ngModel)]="selectedLabelId">
            <mat-option [value]="null">— None (use size above) —</mat-option>
            @for (lbl of storedLabels; track lbl.id) {
              <mat-option [value]="lbl.id">
                {{ lbl.name }}{{ lbl.isDefault ? ' (default)' : '' }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="loadingProducts">
        <mat-icon class="spin">sync</mat-icon>
        <p>Loading products…</p>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loadingProducts && !items.length">
        <mat-icon>qr_code</mat-icon>
        <h3>No products found</h3>
        <p>Try a different search term.</p>
      </div>

      <!-- Product grid -->
      <div class="barcode-grid" *ngIf="!loadingProducts && items.length">
        @for (item of items; track item.sku) {
          <mat-card class="barcode-card"
            [class.selected-card]="item.selected">
          <mat-card-content>
            <div class="card-header">
              <mat-checkbox [(ngModel)]="item.selected" color="primary"></mat-checkbox>
              <div class="product-info">
                <span class="product-name">{{ item.name }}</span>
                <span class="product-sku">SKU: {{ item.sku }}</span>
              </div>
            </div>

            <!-- Barcode image -->
            <div class="barcode-img-wrap">
              <div *ngIf="item.loading" class="img-loading">
                <mat-icon class="spin">sync</mat-icon>
              </div>
              <img *ngIf="item.imageUrl && !item.loading"
                [src]="item.imageUrl"
                [alt]="item.barcode"
                class="barcode-img">
              <p *ngIf="!item.imageUrl && !item.loading" class="barcode-text">{{ item.barcode }}</p>
            </div>

            <!-- Qty + actions -->
            <div class="card-footer">
              <div class="qty-row">
                <label class="qty-label">Copies:</label>
                <button mat-icon-button (click)="item.qty = max(1, item.qty - 1)" [disabled]="item.qty <= 1">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="qty-val">{{ item.qty }}</span>
                <button mat-icon-button (click)="item.qty = item.qty + 1">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              <button mat-icon-button matTooltip="Download PNG" (click)="download(item)">
                <mat-icon>download</mat-icon>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
    .subtitle { margin: 0; color: #6b7280; font-size: 14px; }
    .filters-row { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
    .search-field { flex: 1; }
    .loading-state, .empty-state { text-align: center; padding: 60px; color: #9ca3af; }
    .loading-state mat-icon, .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 16px; }
    .barcode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .barcode-card { border: 2px solid transparent; transition: border-color 0.2s; cursor: default; }
    .selected-card { border-color: #3b82f6; }
    .card-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
    .product-info { display: flex; flex-direction: column; min-width: 0; }
    .product-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .product-sku { font-size: 12px; color: #6b7280; }
    .barcode-img-wrap { display: flex; justify-content: center; align-items: center; height: 80px; background: #f9fafb; border-radius: 6px; margin-bottom: 12px; }
    .barcode-img { max-height: 72px; max-width: 100%; }
    .img-loading { display: flex; justify-content: center; align-items: center; width: 100%; }
    .barcode-text { font-family: monospace; font-size: 13px; color: #374151; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; }
    .qty-row { display: flex; align-items: center; gap: 4px; }
    .qty-label { font-size: 13px; color: #6b7280; margin-right: 4px; }
    .qty-val { font-size: 16px; font-weight: 600; min-width: 24px; text-align: center; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 600px) { .filters-row { flex-wrap: wrap; } .search-field { width: 100%; } }

    /* Print styles */
    @media print {
      .page-header, .filters-row, .card-header mat-checkbox, .card-footer { display: none !important; }
      .page-container { padding: 0; }
      .barcode-grid { display: block; }
      .barcode-card { display: inline-block; margin: 4px; border: 1px solid #ccc; page-break-inside: avoid; }
      .selected-card { display: inline-block; }
      mat-card:not(.selected-card) { display: none !important; }
    }
  `],
})
export class BarcodePrintComponent implements OnInit {
  items: BarcodeItem[] = [];
  loadingProducts = true;
  search = '';
  labelSize: 'small' | 'medium' | 'large' = 'medium';
  storedLabels: BarcodeLabel[] = [];
  selectedLabelId: number | null = null;

  private allProducts: any[] = [];

  constructor(
    private productService: ProductService,
    private barcodeService: BarcodeService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    // Load stored label templates
    this.barcodeService.getAllLabels().subscribe({
      next: (labels) => {
        this.storedLabels = labels;
        // Auto-select the default label template if one exists
        const def = labels.find((l) => l.isDefault);
        if (def) this.selectedLabelId = def.id;
      },
    });

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.buildItems(this.allProducts);
        this.loadingProducts = false;
      },
      error: () => {
        this.snackBar.open('Failed to load products.', 'Close', { duration: 3000 });
        this.loadingProducts = false;
      },
    });
  }

  onSearch() {
    const q = this.search.toLowerCase().trim();
    const filtered = q
      ? this.allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q) ||
            (p.barcode ?? '').toLowerCase().includes(q),
        )
      : this.allProducts;
    this.buildItems(filtered);
  }

  private buildItems(products: any[]) {
    this.items = products.map((p) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku ?? '—',
      barcode: p.barcode ?? p.sku ?? String(p.id),
      selected: false,
      qty: 1,
      imageUrl: null,
      loading: true,
    }));
    // Load barcode images
    this.items.forEach((item) => this.loadBarcode(item));
  }

  private loadBarcode(item: BarcodeItem) {
    this.barcodeService.getProductBarcodeBlob(item.productId).subscribe({
      next: (blob) => {
        this.barcodeService.blobToDataUrl(blob).then((url) => {
          item.imageUrl = this.sanitizer.bypassSecurityTrustUrl(url);
          item.loading = false;
        });
      },
      error: () => {
        item.loading = false;
      },
    });
  }

  get selectedItems() {
    return this.items.filter((i) => i.selected);
  }

  selectAll() {
    const allSelected = this.items.every((i) => i.selected);
    this.items.forEach((i) => (i.selected = !allSelected));
  }

  max(a: number, b: number) {
    return Math.max(a, b);
  }

  download(item: BarcodeItem) {
    this.barcodeService.getProductBarcodeBlob(item.productId).subscribe({
      next: (blob) => {
        this.barcodeService.downloadBarcode(blob, `${item.sku}-barcode.png`);
      },
      error: () => this.snackBar.open('Could not download barcode.', 'Close', { duration: 3000 }),
    });
  }

  printSelected() {
    if (!this.selectedItems.length) return;

    // Use stored label template dimensions if one is selected, else fall back to hardcoded sizes
    const storedLabel = this.selectedLabelId
      ? this.storedLabels.find((l) => l.id === this.selectedLabelId)
      : null;

    let w: string;
    let h: string;
    let fontSize = 7;

    if (storedLabel && storedLabel.width && storedLabel.height) {
      w = `${storedLabel.width}mm`;
      h = `${storedLabel.height}mm`;
      if (storedLabel.fontSize) fontSize = storedLabel.fontSize;
    } else {
      const sizeMap = { small: '2cm', medium: '4cm', large: '6cm' };
      const hMap = { small: '1cm', medium: '2cm', large: '3cm' };
      w = sizeMap[this.labelSize];
      h = hMap[this.labelSize];
    }

    // Build print HTML with selected items × qty
    const labels = this.selectedItems.flatMap((item) =>
      Array(item.qty)
        .fill(null)
        .map(
          () => `
        <div class="label">
          <p class="label-name">${item.name}</p>
          ${item.imageUrl ? `<img src="${(item.imageUrl as any).changingThisBreaksApplicationSecurity ?? item.imageUrl}" alt="${item.sku}">` : ''}
          <p class="label-sku">${item.sku}</p>
        </div>`,
        ),
    );

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Barcode Labels</title>
      <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        .labels-wrap { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; }
        .label { width: ${w}; height: ${h}; border: 1px solid #ccc; display: flex;
          flex-direction: column; align-items: center; justify-content: center;
          page-break-inside: avoid; padding: 2px; box-sizing: border-box; }
        .label img { max-width: 100%; max-height: 60%; }
        .label-name { font-size: ${fontSize}px; margin: 0; text-align: center; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; width: 100%; }
        .label-sku { font-size: ${fontSize}px; margin: 0; color: #555; }
      </style>
    </head><body>
      <div class="labels-wrap">${labels.join('')}</div>
    </body></html>`;

    const w2 = window.open('', '_blank');
    if (w2) {
      w2.document.write(html);
      w2.document.close();
      w2.focus();
      setTimeout(() => { w2.print(); }, 500);
    }
  }
}
