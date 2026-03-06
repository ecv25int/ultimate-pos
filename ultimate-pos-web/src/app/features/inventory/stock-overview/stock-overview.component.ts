import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { InventoryService } from '../../../core/services/inventory.service';
import {
  StockOverviewItem,
  InventorySummary,
} from '../../../core/models/inventory.model';

@Component({
  selector: 'app-stock-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="inventory-container">
      <div class="page-header">
        <div>
          <h1>Inventory</h1>
          <p class="subtitle">Live stock levels for all tracked products</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/inventory/adjust">
          <mat-icon>add</mat-icon>
          Stock Entry
        </button>
      </div>

      <!-- Summary cards -->
      <div class="stats-row">
        <div class="stat-card">
          <mat-icon>inventory_2</mat-icon>
          <div>
            <span class="stat-value">{{ summary?.totalProducts ?? '—' }}</span>
            <span class="stat-label">Tracked Products</span>
          </div>
        </div>
        <div class="stat-card adequate">
          <mat-icon>check_circle</mat-icon>
          <div>
            <span class="stat-value">{{ summary?.adequateStock ?? '—' }}</span>
            <span class="stat-label">Adequate Stock</span>
          </div>
        </div>
        <div class="stat-card warning">
          <mat-icon>warning</mat-icon>
          <div>
            <span class="stat-value">{{ summary?.lowStockCount ?? '—' }}</span>
            <span class="stat-label">Low Stock</span>
          </div>
        </div>
        <div class="stat-card danger">
          <mat-icon>remove_circle</mat-icon>
          <div>
            <span class="stat-value">{{ summary?.outOfStockCount ?? '—' }}</span>
            <span class="stat-label">Out of Stock</span>
          </div>
        </div>
        <div class="stat-card value">
          <mat-icon>attach_money</mat-icon>
          <div>
            <span class="stat-value">{{ summary?.totalStockValue | number:'1.2-2' }}</span>
            <span class="stat-label">Est. Stock Value</span>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search products</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)" placeholder="Product name or SKU..." />
          <mat-icon matSuffix>search</mat-icon>
          @if (searchQuery) {
            <button matSuffix mat-icon-button (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      <!-- Table -->
      <div class="table-card">
        @if (loading) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
        @if (!loading && pagedItems.length === 0) {
          <div class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <h3>No tracked products</h3>
            <p>Enable stock tracking on products to see them here.</p>
            <button mat-raised-button color="primary" routerLink="/products">
              Manage Products
            </button>
          </div>
        } @else if (pagedItems.length > 0) {
          <table mat-table [dataSource]="pagedItems">

            <!-- Product -->
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Product</th>
              <td mat-cell *matCellDef="let item">
                <div class="product-cell">
                  <span class="product-name">{{ item.name }}</span>
                  <span class="product-sku">{{ item.sku }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Category -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let item">{{ item.category?.name ?? '—' }}</td>
            </ng-container>

            <!-- Unit -->
            <ng-container matColumnDef="unit">
              <th mat-header-cell *matHeaderCellDef>Unit</th>
              <td mat-cell *matCellDef="let item">{{ item.unit?.shortName ?? '—' }}</td>
            </ng-container>

            <!-- Alert qty -->
            <ng-container matColumnDef="alertQty">
              <th mat-header-cell *matHeaderCellDef>Alert Qty</th>
              <td mat-cell *matCellDef="let item">{{ item.alertQuantity }}</td>
            </ng-container>

            <!-- Current stock -->
            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Current Stock</th>
              <td mat-cell *matCellDef="let item">
                <span
                  class="stock-badge"
                  [class.stock-ok]="item.currentStock > item.alertQuantity"
                  [class.stock-low]="item.currentStock > 0 && item.currentStock <= item.alertQuantity"
                  [class.stock-zero]="item.currentStock <= 0"
                >
                  {{ item.currentStock | number:'1.0-4' }}
                </span>
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let item">
                @if (item.currentStock <= 0) {
                  <span class="status-badge status-out">Out of Stock</span>
                } @else if (item.isLowStock) {
                  <span class="status-badge status-low">Low Stock</span>
                } @else {
                  <span class="status-badge status-ok">In Stock</span>
                }
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let item">
                <button mat-icon-button matTooltip="View History" [routerLink]="['/inventory/history', item.id]">
                  <mat-icon>history</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Add Stock" [routerLink]="['/inventory/adjust']" [queryParams]="{productId: item.id}">
                  <mat-icon>add_circle_outline</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" [class.row-low]="row.isLowStock && row.currentStock > 0" [class.row-out]="row.currentStock <= 0"></tr>
          </table>

          <mat-paginator
            [length]="filteredItems.length"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          ></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .inventory-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0 0 4px; font-size: 28px; font-weight: 600; }
    .subtitle { margin: 0; color: #666; }

    .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .stat-card mat-icon { font-size: 30px; width: 30px; height: 30px; color: #6366f1; }
    .stat-card.adequate mat-icon { color: #10b981; }
    .stat-card.warning mat-icon { color: #f59e0b; }
    .stat-card.danger mat-icon { color: #ef4444; }
    .stat-card.value mat-icon { color: #0ea5e9; }
    .stat-value { display: block; font-size: 22px; font-weight: 700; }
    .stat-label { display: block; font-size: 11px; color: #666; }

    .search-bar { margin-bottom: 16px; }
    .search-field { width: 360px; }

    .table-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; gap: 12px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state h3 { margin: 0; color: #555; }
    .empty-state p { margin: 0; }

    .product-cell { display: flex; flex-direction: column; }
    .product-name { font-weight: 500; }
    .product-sku { font-size: 11px; color: #888; }

    .stock-badge { font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    .stock-ok { background: #d1fae5; color: #065f46; }
    .stock-low { background: #fef3c7; color: #92400e; }
    .stock-zero { background: #fee2e2; color: #991b1b; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
    .status-ok { background: #d1fae5; color: #065f46; }
    .status-low { background: #fef3c7; color: #92400e; }
    .status-out { background: #fee2e2; color: #991b1b; }

    .row-low { background-color: #fffbeb; }
    .row-out { background-color: #fff1f2; }

    table { width: 100%; }
    @media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
  `],
})
export class StockOverviewComponent implements OnInit {
  items: StockOverviewItem[] = [];
  filteredItems: StockOverviewItem[] = [];
  pagedItems: StockOverviewItem[] = [];
  summary: InventorySummary | null = null;
  loading = false;
  searchQuery = '';
  pageIndex = 0;
  pageSize = 25;
  displayedColumns = ['product', 'category', 'unit', 'alertQty', 'stock', 'status', 'actions'];

  private searchSubject = new Subject<string>();

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.applyFilter();
    });
    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      summary: this.inventoryService.getSummary(),
      items: this.inventoryService.getStockOverview(),
    }).subscribe({
      next: ({ summary, items }) => {
        this.summary = summary;
        this.items = items;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load inventory data', 'Close', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  onSearch(value: string) { this.searchSubject.next(value); }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilter();
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase();
    this.filteredItems = q.length >= 2
      ? this.items.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      : [...this.items];
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage() {
    const start = this.pageIndex * this.pageSize;
    this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
  }

  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.updatePage();
  }
}
