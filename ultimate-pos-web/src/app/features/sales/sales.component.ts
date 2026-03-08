import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SalesService } from '../../core/services/sales.service';
import { PaymentsService } from '../../core/services/payments.service';
import {
  SaleListItem,
  SaleSummary,
  SaleStatus,
  PaymentStatus,
} from '../../core/models/sale.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    SkeletonLoaderComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Sales</h1>
          <p class="subtitle">Manage your sales transactions</p>
        </div>
        <button mat-raised-button color="primary" routerLink="create">
          <mat-icon>add</mat-icon> New Sale
        </button>
      </div>

      <!-- Bulk Payment Bar -->
      <div class="bulk-bar" *ngIf="selectedIds.size > 0">
        <span>{{ selectedIds.size }} sale{{ selectedIds.size > 1 ? 's' : '' }} selected</span>
        <mat-form-field appearance="outline" class="bulk-method">
          <mat-label>Payment Method</mat-label>
          <mat-select [(ngModel)]="bulkMethod">
            <mat-option value="cash">Cash</mat-option>
            <mat-option value="card">Card</mat-option>
            <mat-option value="bank_transfer">Bank Transfer</mat-option>
            <mat-option value="check">Check</mat-option>
            <mat-option value="other">Other</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-raised-button color="accent" (click)="submitBulkPayment()" [disabled]="bulkSubmitting">
          <mat-icon>payments</mat-icon> {{ bulkSubmitting ? 'Processing…' : 'Record Full Payments' }}
        </button>
        <button mat-button (click)="clearSelection()">Clear</button>
        <span *ngIf="bulkError" class="bulk-error">{{ bulkError }}</span>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid" *ngIf="summary">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ summary.totalSales }}</div>
            <div class="stat-label">Total Sales</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card revenue">
          <mat-card-content>
            <div class="stat-value">{{ summary.totalRevenue | number:'1.2-2' }}</div>
            <div class="stat-label">Total Revenue</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card collected">
          <mat-card-content>
            <div class="stat-value">{{ summary.totalCollected | number:'1.2-2' }}</div>
            <div class="stat-label">Collected</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card outstanding">
          <mat-card-content>
            <div class="stat-value">{{ summary.outstanding | number:'1.2-2' }}</div>
            <div class="stat-label">Outstanding</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card due">
          <mat-card-content>
            <div class="stat-value">{{ summary.due }}</div>
            <div class="stat-label">Due</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Type quick-filter chips -->
      <div class="type-chips">
        <mat-chip-listbox [value]="typeFilter" (change)="setTypeFilter($event.value)">
          <mat-chip-option value="">All Sales</mat-chip-option>
          <mat-chip-option value="sale">Confirmed</mat-chip-option>
          <mat-chip-option value="quotation">Quotations</mat-chip-option>
          <mat-chip-option value="draft-status">Drafts</mat-chip-option>
        </mat-chip-listbox>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search invoice or customer</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [formControl]="searchCtrl" placeholder="e.g. SALE-2026..." />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusCtrl">
                <mat-option value="">All</mat-option>
                <mat-option value="draft">Draft</mat-option>
                <mat-option value="final">Final</mat-option>
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="completed">Completed</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Payment</mat-label>
              <mat-select [formControl]="paymentStatusCtrl">
                <mat-option value="">All</mat-option>
                <mat-option value="due">Due</mat-option>
                <mat-option value="partial">Partial</mat-option>
                <mat-option value="paid">Paid</mat-option>
                <mat-option value="overdue">Overdue</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      <mat-card>
        <mat-card-content>
          @if (loading) {
            <app-skeleton-loader [rows]="8" type="table"></app-skeleton-loader>
          }

          <table mat-table [dataSource]="sales" *ngIf="!loading">
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox
                  [checked]="allDueSelected()"
                  [indeterminate]="someSelected()"
                  (change)="toggleAll()"
                ></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let s">
                <mat-checkbox
                  *ngIf="s.paymentStatus !== 'paid'"
                  [checked]="selectedIds.has(s.id)"
                  (change)="toggleSelect(s)"
                ></mat-checkbox>
              </td>
            </ng-container>
            <ng-container matColumnDef="invoiceNo">
              <th mat-header-cell *matHeaderCellDef>Invoice #</th>
              <td mat-cell *matCellDef="let s">
                <a class="invoice-link" [routerLink]="[s.id]">{{ s.invoiceNo }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let s">{{ s.transactionDate | date:'mediumDate' }}</td>
            </ng-container>

            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let s">{{ s.contact?.name ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef>Items</th>
              <td mat-cell *matCellDef="let s">{{ s.lines.length }}</td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let s">{{ s.totalAmount | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="paid">
              <th mat-header-cell *matHeaderCellDef>Paid</th>
              <td mat-cell *matCellDef="let s">{{ s.paidAmount | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s">
                @if (s.type === 'quotation') {
                  <span class="badge badge-quotation">Quotation</span>
                } @else {
                  <span class="badge" [class]="'badge-' + s.status">{{ s.status }}</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="paymentStatus">
              <th mat-header-cell *matHeaderCellDef>Payment</th>
              <td mat-cell *matCellDef="let s">
                <span class="badge" [class]="'badge-pay-' + s.paymentStatus">{{ s.paymentStatus }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let s">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu>
                  <button mat-menu-item [routerLink]="[s.id]">
                    <mat-icon>visibility</mat-icon> View
                  </button>
                  @if (s.type === 'quotation' || s.status === 'draft') {
                    <button mat-menu-item (click)="convertToInvoice(s.id)">
                      <mat-icon>receipt</mat-icon> Convert to Invoice
                    </button>
                  }
                  <button mat-menu-item (click)="deleteSale(s.id)">
                    <mat-icon color="warn">delete</mat-icon> Delete
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="columns.length">
                No sales found.
              </td>
            </tr>
          </table>

          <div class="pagination-row" *ngIf="total > 0">
            <span>Showing {{ sales.length }} of {{ total }}</span>
            <div class="page-btns">
              <button mat-stroked-button [disabled]="page === 1" (click)="prevPage()">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span>Page {{ page }}</span>
              <button mat-stroked-button [disabled]="sales.length < limit" (click)="nextPage()">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { text-align: center; }
    .stat-value { font-size: 1.8rem; font-weight: 700; }
    .stat-label { color: #666; font-size: 0.85rem; margin-top: 4px; }
    .revenue .stat-value { color: #1976d2; }
    .collected .stat-value { color: #388e3c; }
    .outstanding .stat-value { color: #f57c00; }
    .due .stat-value { color: #d32f2f; }
    .type-chips { margin-bottom: 16px; }
    .filter-card { margin-bottom: 24px; }
    .filter-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
    .search-field { flex: 1; min-width: 240px; }
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    table { width: 100%; }
    .invoice-link { color: #1976d2; text-decoration: none; font-weight: 500; }
    .invoice-link:hover { text-decoration: underline; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 500; text-transform: capitalize; }
    .badge-draft { background: #f5f5f5; color: #666; }
    .badge-final { background: #e3f2fd; color: #1565c0; }
    .badge-pending { background: #fff3e0; color: #e65100; }
    .badge-completed { background: #e8f5e9; color: #1b5e20; }
    .badge-quotation { background: #f3e5f5; color: #6a1b9a; }
    .badge-pay-due { background: #ffebee; color: #c62828; }
    .badge-pay-partial { background: #fff3e0; color: #e65100; }
    .badge-pay-paid { background: #e8f5e9; color: #1b5e20; }
    .badge-pay-overdue { background: #fce4ec; color: #880e4f; }
    .type-tag { font-size: 0.7rem; font-style: italic; color: #9e9e9e; margin-left: 4px; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .pagination-row { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
    .page-btns { display: flex; align-items: center; gap: 8px; }
    .bulk-bar { display: flex; align-items: center; gap: 12px; background: #e8f4fd; border: 1px solid #90caf9; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .bulk-method { width: 180px; }
    .bulk-error { color: #d32f2f; font-size: 13px; }
  `],
})
export class SalesComponent implements OnInit, OnDestroy {
  columns = ['select', 'invoiceNo', 'date', 'customer', 'items', 'total', 'paid', 'status', 'paymentStatus', 'actions'];
  sales: SaleListItem[] = [];
  summary: SaleSummary | null = null;
  loading = false;
  total = 0;
  page = 1;
  limit = 20;
  typeFilter = '';

  // Bulk payment state
  selectedIds = new Set<number>();
  selectedSales = new Map<number, SaleListItem>();
  bulkMethod: string = 'cash';
  bulkSubmitting = false;
  bulkError = '';

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');
  paymentStatusCtrl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private salesService: SalesService,
    private paymentsService: PaymentsService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadSummary();
    this.loadSales();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$),
    ).subscribe(() => { this.page = 1; this.loadSales(); });

    this.statusCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.loadSales(); });

    this.paymentStatusCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.loadSales(); });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  loadSummary() {
    this.salesService.getSummary().subscribe({ next: (s) => (this.summary = s) });
  }

  loadSales() {
    this.loading = true;
    this.clearSelection();
    // 'draft-status' is our internal token for status=draft filter
    const isDraftFilter = this.typeFilter === 'draft-status';
    this.salesService.getSales({
      search: this.searchCtrl.value ?? undefined,
      status: isDraftFilter ? 'draft' : (this.statusCtrl.value ?? undefined),
      paymentStatus: this.paymentStatusCtrl.value ?? undefined,
      type: isDraftFilter ? undefined : (this.typeFilter || undefined),
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (res) => { this.sales = res.data; this.total = res.total; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  prevPage() { if (this.page > 1) { this.page--; this.loadSales(); } }
  nextPage() { this.page++; this.loadSales(); }

  setTypeFilter(value: string) {
    this.typeFilter = value ?? '';
    this.page = 1;
    this.loadSales();
  }

  convertToInvoice(id: number) {
    this.salesService.convertToInvoice(id).subscribe({
      next: (sale: any) => {
        this.snackBar.open(`Converted to invoice ${sale.invoiceNo}`, 'OK', { duration: 3000 });
        this.loadSales();
      },
      error: () => this.snackBar.open('Conversion failed', 'Dismiss', { duration: 3000 }),
    });
  }

  deleteSale(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Sale', message: 'Delete this sale? This action cannot be undone.' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.salesService.deleteSale(id).subscribe({ next: () => this.loadSales() });
    });
  }

  toggleSelect(sale: SaleListItem) {
    if (this.selectedIds.has(sale.id)) {
      this.selectedIds.delete(sale.id);
      this.selectedSales.delete(sale.id);
    } else {
      this.selectedIds.add(sale.id);
      this.selectedSales.set(sale.id, sale);
    }
    this.cdr.markForCheck();
  }

  toggleAll() {
    const unpaid = this.sales.filter(s => s.paymentStatus !== 'paid');
    if (this.selectedIds.size === unpaid.length) {
      this.clearSelection();
    } else {
      unpaid.forEach(s => { this.selectedIds.add(s.id); this.selectedSales.set(s.id, s); });
      this.cdr.markForCheck();
    }
  }

  allDueSelected(): boolean {
    const unpaid = this.sales.filter(s => s.paymentStatus !== 'paid');
    return unpaid.length > 0 && unpaid.every(s => this.selectedIds.has(s.id));
  }

  someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allDueSelected();
  }

  clearSelection() {
    this.selectedIds.clear();
    this.selectedSales.clear();
    this.bulkError = '';
    this.cdr.markForCheck();
  }

  submitBulkPayment() {
    if (!this.selectedIds.size) return;
    const payments = Array.from(this.selectedSales.values()).map(s => ({
      saleId: s.id,
      amount: +(+s.totalAmount - +s.paidAmount).toFixed(2),
      method: this.bulkMethod as any,
    })).filter(p => p.amount > 0);

    if (!payments.length) {
      this.bulkError = 'All selected sales are already fully paid.';
      return;
    }

    this.bulkSubmitting = true;
    this.bulkError = '';
    this.paymentsService.createBulk({ payments }).subscribe({
      next: (res) => {
        this.bulkSubmitting = false;
        this.snackBar.open(`Recorded ${res.created} payment(s) successfully`, 'OK', { duration: 4000 });
        this.clearSelection();
        this.loadSales();
      },
      error: (err) => {
        this.bulkSubmitting = false;
        this.bulkError = err?.error?.message || 'Bulk payment failed';
        this.cdr.markForCheck();
      },
    });
  }
}

