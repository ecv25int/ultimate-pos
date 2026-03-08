import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchasesService } from '../../core/services/purchases.service';
import { Purchase, PurchaseStatus, PurchasePaymentStatus, PurchaseSummary } from '../../core/models/purchase.model';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-purchases',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonLoaderComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Purchases</h1>
          <p>Manage supplier purchase orders &amp; requisitions</p>
        </div>
        <div class="header-actions">
          <a routerLink="create" [queryParams]="{type:'requisition'}" class="btn btn-outline">+ New Requisition</a>
          <a routerLink="create" class="btn btn-primary">+ New Purchase</a>
        </div>
      </div>

      <!-- Type Tabs -->
      <div class="type-tabs">
        <button class="tab-btn" [class.active]="typeFilter === 'purchase'" (click)="setType('purchase')">
          Purchase Orders
        </button>
        <button class="tab-btn" [class.active]="typeFilter === 'requisition'" (click)="setType('requisition')">
          Requisitions
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid" *ngIf="summary && typeFilter === 'purchase'">
        <div class="stat-card">
          <span class="label">Total Orders</span>
          <span class="value">{{ summary.total }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Total Spend</span>
          <span class="value">{{ summary.totalAmount | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card warning">
          <span class="label">Total Due</span>
          <span class="value">{{ summary.totalDue | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card success">
          <span class="label">Total Paid</span>
          <span class="value">{{ summary.totalPaid | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input
          type="text"
          placeholder="Search by ref no or supplier..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch()"
          class="search-input"
        />
        <select *ngIf="typeFilter === 'purchase'" [(ngModel)]="statusFilter" (ngModelChange)="load()" class="filter-select">
          <option value="">All Statuses</option>
          <option value="ordered">Ordered</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select *ngIf="typeFilter === 'purchase'" [(ngModel)]="paymentFilter" (ngModelChange)="load()" class="filter-select">
          <option value="">All Payment</option>
          <option value="due">Due</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-container">
        @if (loading) {
          <app-skeleton-loader [rows]="8" type="table"></app-skeleton-loader>
        } @else {
        <table class="data-table" *ngIf="purchases.length > 0; else empty">
          <thead>
            <tr>
              <th>Ref No</th>
              <th>Supplier</th>
              <th>Date</th>
              <th *ngIf="typeFilter === 'purchase'">Status</th>
              <th *ngIf="typeFilter === 'purchase'">Payment</th>
              <th class="text-right">Total</th>
              <th *ngIf="typeFilter === 'purchase'" class="text-right">Paid</th>
              <th *ngIf="typeFilter === 'purchase'" class="text-right">Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of purchases">
              <td><a [routerLink]="[p.id]" class="link">{{ p.refNo }}</a></td>
              <td>{{ p.contact?.name || '—' }}</td>
              <td>{{ p.purchaseDate | date:'mediumDate' }}</td>
              <td *ngIf="typeFilter === 'purchase'"><span class="badge" [ngClass]="statusClass(p.status)">{{ p.status }}</span></td>
              <td *ngIf="typeFilter === 'purchase'"><span class="badge" [ngClass]="paymentClass(p.paymentStatus)">{{ p.paymentStatus }}</span></td>
              <td class="text-right">{{ p.totalAmount | number:'1.2-2' }}</td>
              <td *ngIf="typeFilter === 'purchase'" class="text-right">{{ p.paidAmount | number:'1.2-2' }}</td>
              <td *ngIf="typeFilter === 'purchase'" class="text-right">{{ (p.totalAmount - p.paidAmount) | number:'1.2-2' }}</td>
              <td class="actions-cell">
                <a [routerLink]="[p.id]" class="action-link">View</a>
                <button *ngIf="typeFilter === 'requisition'" class="btn-convert" (click)="convertToOrder(p)" [disabled]="converting === p.id">
                  {{ converting === p.id ? 'Converting…' : 'Convert to Order' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <div class="empty-state">
            {{ typeFilter === 'requisition' ? 'No requisitions found.' : 'No purchases found.' }}
          </div>
        </ng-template>
        }
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="total > limit">
        <button (click)="prevPage()" [disabled]="page <= 1" class="btn btn-sm">Prev</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button (click)="nextPage()" [disabled]="page >= totalPages" class="btn btn-sm">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .page-header p { margin: 0; color: #666; font-size: 0.9rem; }
    .header-actions { display: flex; gap: 10px; }
    .type-tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; }
    .tab-btn { padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 14px; font-weight: 500; color: #6b7280; margin-bottom: -2px; }
    .tab-btn.active { color: #4f46e5; border-bottom-color: #4f46e5; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .stat-card.warning { border-left: 4px solid #f59e0b; }
    .stat-card.success { border-left: 4px solid #10b981; }
    .stat-card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
    .stat-card .value { font-size: 22px; font-weight: 700; color: #111827; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-input, .filter-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
    .search-input { flex: 1; min-width: 200px; }
    .table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .data-table th { background: #f9fafb; font-weight: 600; color: #374151; }
    .actions-cell { display: flex; gap: 8px; align-items: center; }
    .text-right { text-align: right; }
    .badge { padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    .badge.received { background: #d1fae5; color: #065f46; }
    .badge.ordered { background: #dbeafe; color: #1e40af; }
    .badge.pending { background: #fef3c7; color: #92400e; }
    .badge.cancelled { background: #fee2e2; color: #991b1b; }
    .badge.paid { background: #d1fae5; color: #065f46; }
    .badge.partial { background: #fef3c7; color: #92400e; }
    .badge.due { background: #fee2e2; color: #991b1b; }
    .link, .action-link { color: #4f46e5; text-decoration: none; font-weight: 500; }
    .btn-convert { padding: 4px 10px; background: #f5f3ff; color: #5b21b6; border: 1px solid #c4b5fd; border-radius: 4px; font-size: 12px; cursor: pointer; }
    .btn-convert:disabled { opacity: .5; cursor: not-allowed; }
    .empty-state { padding: 48px; text-align: center; color: #9ca3af; }
    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; }
    .btn { padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid transparent; }
    .btn-primary { background: #4f46e5; color: #fff; text-decoration: none; }
    .btn-outline { background: #fff; color: #4f46e5; border-color: #4f46e5; text-decoration: none; }
    .btn-sm { padding: 6px 12px; background: #f3f4f6; color: #374151; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class PurchasesComponent implements OnInit {
  loading = false;
  purchases: Purchase[] = [];
  summary: PurchaseSummary | null = null;
  total = 0;
  page = 1;
  limit = 20;
  searchQuery = '';
  statusFilter = '';
  paymentFilter = '';
  typeFilter: 'purchase' | 'requisition' = 'purchase';
  converting: number | null = null;
  private searchTimer: any;

  get totalPages() { return Math.ceil(this.total / this.limit); }

  constructor(private purchasesService: PurchasesService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadSummary();
    this.load();
  }

  loadSummary() {
    this.purchasesService.getSummary().subscribe({ next: s => this.summary = s });
  }

  setType(type: 'purchase' | 'requisition') {
    this.typeFilter = type;
    this.page = 1;
    this.statusFilter = '';
    this.paymentFilter = '';
    this.load();
  }

  load() {
    this.loading = true;
    this.purchasesService.getAll({
      search: this.searchQuery || undefined,
      status: this.statusFilter || undefined,
      paymentStatus: this.paymentFilter || undefined,
      type: this.typeFilter,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: res => { this.purchases = res.data; this.total = res.total; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.load(); }, 300);
  }

  prevPage() { if (this.page > 1) { this.page--; this.load(); } }
  nextPage() { if (this.page < this.totalPages) { this.page++; this.load(); } }

  statusClass(s: PurchaseStatus) { return { [s]: true }; }
  paymentClass(s: PurchasePaymentStatus) { return { [s]: true }; }

  convertToOrder(p: Purchase) {
    if (!confirm(`Convert requisition "${p.refNo}" to a purchase order?`)) return;
    this.converting = p.id;
    this.purchasesService.convertToOrder(p.id).subscribe({
      next: () => { this.converting = null; this.load(); },
      error: () => { this.converting = null; this.cdr.markForCheck(); },
    });
  }
}
