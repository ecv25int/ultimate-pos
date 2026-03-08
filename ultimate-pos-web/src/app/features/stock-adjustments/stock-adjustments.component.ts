import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { StockEntry, StockOverviewItem } from '../../core/models/inventory.model';

@Component({
  selector: 'app-stock-adjustments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">tune</mat-icon>
          <div>
            <h1>Stock Adjustments</h1>
            <p class="subtitle">Add or subtract stock quantities with a reason</p>
          </div>
        </div>
      </div>

      <div class="two-column-layout">
        <!-- Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>add_circle</mat-icon>
            <mat-card-title>New Adjustment</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()">

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Search Product</mat-label>
                <input matInput [(ngModel)]="productSearch" [ngModelOptions]="{standalone: true}"
                  (input)="searchProducts()" placeholder="Type product name…" />
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" *ngIf="filteredProducts.length">
                <mat-label>Select Product *</mat-label>
                <mat-select formControlName="productId">
                  <mat-option *ngFor="let p of filteredProducts" [value]="p.id">
                    {{ p.name }} ({{ p.sku }}) — Stock: {{ p.currentStock }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('productId')?.invalid && form.get('productId')?.touched">
                  Select a product
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Adjustment Type *</mat-label>
                <mat-select formControlName="entryType">
                  <mat-option value="adjustment_in">Add Stock (In)</mat-option>
                  <mat-option value="adjustment_out">Remove Stock (Out)</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Quantity *</mat-label>
                <input matInput type="number" formControlName="quantity" min="0.01" step="0.01" />
                <mat-error *ngIf="form.get('quantity')?.invalid && form.get('quantity')?.touched">
                  Enter a positive quantity
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Reference No</mat-label>
                <input matInput formControlName="referenceNo" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Note / Reason</mat-label>
                <textarea matInput formControlName="note" rows="3"></textarea>
              </mat-form-field>

              <div class="form-actions">
                <button mat-button type="button" (click)="resetForm()">Clear</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="saving">
                  <mat-spinner *ngIf="saving" diameter="18"></mat-spinner>
                  <span *ngIf="!saving">Save Adjustment</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>history</mat-icon>
            <mat-card-title>Recent Adjustments</mat-card-title>
            <mat-card-subtitle>{{ total }} total</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>

            <table mat-table [dataSource]="adjustments" *ngIf="!loading">

              <ng-container matColumnDef="product">
                <th mat-header-cell *matHeaderCellDef>Product</th>
                <td mat-cell *matCellDef="let row">{{ row.product?.name ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let row">
                  <span class="badge" [class]="row.entryType === 'adjustment_in' ? 'badge-in' : 'badge-out'">
                    {{ row.entryType === 'adjustment_in' ? '+In' : '−Out' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef>Qty</th>
                <td mat-cell *matCellDef="let row">{{ row.quantity }}</td>
              </ng-container>

              <ng-container matColumnDef="note">
                <th mat-header-cell *matHeaderCellDef>Note</th>
                <td mat-cell *matCellDef="let row">{{ row.note ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'shortDate' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>

            <mat-paginator
              [length]="total"
              [pageSize]="10"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPage($event)">
            </mat-paginator>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .two-column-layout { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: start; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    table { width: 100%; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.78rem; font-weight: 500; }
    .badge-in { background: #e8f5e9; color: #1b5e20; }
    .badge-out { background: #ffebee; color: #c62828; }
    @media (max-width: 900px) { .two-column-layout { grid-template-columns: 1fr; } }
  `],
})
export class StockAdjustmentsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  saving = false;
  loading = false;

  productSearch = '';
  allProducts: StockOverviewItem[] = [];
  filteredProducts: StockOverviewItem[] = [];

  adjustments: StockEntry[] = [];
  total = 0;
  page = 1;
  columns = ['product', 'type', 'qty', 'note', 'date'];

  ngOnInit() {
    this.form = this.fb.group({
      productId: [null, Validators.required],
      entryType: ['adjustment_in', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
      referenceNo: [''],
      note: [''],
    });
    this.loadProducts();
    this.loadAdjustments();
  }

  loadProducts() {
    this.inventoryService.getStockOverview().subscribe({ next: (list) => (this.allProducts = list) });
  }

  searchProducts() {
    const q = this.productSearch.toLowerCase();
    this.filteredProducts = q
      ? this.allProducts.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      : [];
  }

  loadAdjustments() {
    this.loading = true;
    this.inventoryService.getAdjustments({ page: this.page, limit: 10 }).subscribe({
      next: (res) => {
        this.adjustments = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPage(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.loadAdjustments();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    this.inventoryService.createEntry(val).subscribe({
      next: () => {
        this.snackBar.open('Adjustment saved.', 'OK', { duration: 3000 });
        this.resetForm();
        this.loadAdjustments();
        this.saving = false;
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Error saving adjustment.', 'Close', { duration: 5000 });
        this.saving = false;
      },
    });
  }

  resetForm() {
    this.form.reset({ entryType: 'adjustment_in' });
    this.productSearch = '';
    this.filteredProducts = [];
  }
}
