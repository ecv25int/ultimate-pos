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
import { StockTransfersService } from '../../core/services/stock-transfers.service';
import { InventoryService } from '../../core/services/inventory.service';
import { StockTransfer } from '../../core/models/stock-transfer.model';
import { StockOverviewItem } from '../../core/models/inventory.model';

@Component({
  selector: 'app-stock-transfers',
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
          <mat-icon class="header-icon">swap_horiz</mat-icon>
          <div>
            <h1>Stock Transfers</h1>
            <p class="subtitle">Move stock between locations or warehouses</p>
          </div>
        </div>
      </div>

      <div class="two-column-layout">
        <!-- Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>add_circle</mat-icon></div>
            <mat-card-title>New Transfer</mat-card-title>
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
                <mat-label>Quantity *</mat-label>
                <input matInput type="number" formControlName="quantity" min="0.01" step="0.01" />
                <mat-error *ngIf="form.get('quantity')?.invalid && form.get('quantity')?.touched">
                  Enter a positive quantity
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>From Location *</mat-label>
                <input matInput formControlName="fromLocation" placeholder="e.g. Warehouse A" />
                <mat-error *ngIf="form.get('fromLocation')?.invalid && form.get('fromLocation')?.touched">
                  Required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>To Location *</mat-label>
                <input matInput formControlName="toLocation" placeholder="e.g. Store Front" />
                <mat-error *ngIf="form.get('toLocation')?.invalid && form.get('toLocation')?.touched">
                  Required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="completed">Completed</mat-option>
                  <mat-option value="pending">Pending</mat-option>
                  <mat-option value="cancelled">Cancelled</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Reference No</mat-label>
                <input matInput formControlName="referenceNo" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Note</mat-label>
                <textarea matInput formControlName="note" rows="2"></textarea>
              </mat-form-field>

              <div class="form-actions">
                <button mat-button type="button" (click)="resetForm()">Clear</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="saving">
                  <mat-spinner *ngIf="saving" diameter="18"></mat-spinner>
                  <span *ngIf="!saving">Create Transfer</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- List -->
        <mat-card class="list-card">
          <mat-card-header>
            <div mat-card-avatar class="card-avatar-icon green"><mat-icon>list_alt</mat-icon></div>
            <mat-card-title>Transfer History</mat-card-title>
            <mat-card-subtitle>{{ total }} total</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>

            <table mat-table [dataSource]="transfers" *ngIf="!loading">

              <ng-container matColumnDef="product">
                <th mat-header-cell *matHeaderCellDef>Product</th>
                <td mat-cell *matCellDef="let row">{{ row.product?.name ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef>Qty</th>
                <td mat-cell *matCellDef="let row">{{ row.quantity }}</td>
              </ng-container>

              <ng-container matColumnDef="from">
                <th mat-header-cell *matHeaderCellDef>From</th>
                <td mat-cell *matCellDef="let row">{{ row.fromLocation }}</td>
              </ng-container>

              <ng-container matColumnDef="to">
                <th mat-header-cell *matHeaderCellDef>To</th>
                <td mat-cell *matCellDef="let row">{{ row.toLocation }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="badge" [class]="'badge-' + row.status">{{ row.status }}</span>
                </td>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .two-column-layout { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; align-items: start; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    table { width: 100%; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.78rem; font-weight: 500; }
    .badge-completed { background: #e8f5e9; color: #1b5e20; }
    .badge-pending { background: #fff3e0; color: #e65100; }
    .badge-cancelled { background: #ffebee; color: #c62828; }
    .form-card, .list-card { border-radius: 12px; overflow: hidden; }
    .card-avatar-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; }
    .card-avatar-icon.blue  { color: #1976d2; background: #e3f2fd; }
    .card-avatar-icon.green { color: #388e3c; background: #e8f5e9; }
    .card-avatar-icon mat-icon { font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    @media (max-width: 900px) { .two-column-layout { grid-template-columns: 1fr; } }
  `],
})
export class StockTransfersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private stockTransfersService = inject(StockTransfersService);
  private inventoryService = inject(InventoryService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  saving = false;
  loading = false;

  productSearch = '';
  allProducts: StockOverviewItem[] = [];
  filteredProducts: StockOverviewItem[] = [];

  transfers: StockTransfer[] = [];
  total = 0;
  page = 1;
  columns = ['product', 'qty', 'from', 'to', 'status', 'date'];

  ngOnInit() {
    this.form = this.fb.group({
      productId: [null, Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
      fromLocation: ['', Validators.required],
      toLocation: ['', Validators.required],
      status: ['completed'],
      referenceNo: [''],
      note: [''],
    });
    this.loadProducts();
    this.loadTransfers();
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

  loadTransfers() {
    this.loading = true;
    this.stockTransfersService.getAll({ page: this.page, limit: 10 }).subscribe({
      next: (res) => {
        this.transfers = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onPage(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.loadTransfers();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    const dto = {
      productId: val.productId,
      quantity: val.quantity,
      fromLocation: val.fromLocation,
      toLocation: val.toLocation,
      status: val.status,
      referenceNo: val.referenceNo || undefined,
      note: val.note || undefined,
    };
    this.stockTransfersService.create(dto).subscribe({
      next: () => {
        this.snackBar.open('Transfer created.', 'OK', { duration: 3000 });
        this.resetForm();
        this.loadTransfers();
        this.saving = false;
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Error creating transfer.', 'Close', { duration: 5000 });
        this.saving = false;
      },
    });
  }

  resetForm() {
    this.form.reset({ status: 'completed' });
    this.productSearch = '';
    this.filteredProducts = [];
  }
}
