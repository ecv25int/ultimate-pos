import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '../../core/auth/auth';
import { RoleService } from '../../core/services/role.service';
import { SalesService } from '../../core/services/sales.service';
import { ExpensesService } from '../../core/services/expenses.service';
import { CashRegisterService } from '../../core/services/cash-register.service';
import { ProductService } from '../../core/services/product.service';
import { SaleSummary, SaleListItem } from '../../core/models/sale.model';
import { ExpenseSummary } from '../../core/models/expense.model';
import { CashRegisterSummary } from '../../core/models/cash-register.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dashboard-container">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Welcome back, {{ currentUser?.firstName || currentUser?.username }}!</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button routerLink="/pos">
            <mat-icon>shopping_cart</mat-icon> New Sale
          </button>
          <button mat-stroked-button routerLink="/products/create">
            <mat-icon>add_box</mat-icon> Add Product
          </button>
          <button mat-raised-button color="primary" routerLink="/expenses/create">
            <mat-icon>add_card</mat-icon> New Expense
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading) {
        <div class="loading-state">
          <mat-spinner diameter="36"></mat-spinner>
          <span>Loading dashboard…</span>
        </div>
      }

      @if (!isLoading) {

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-icon blue"><mat-icon>attach_money</mat-icon></span>
            <div class="stat-body">
              <span class="stat-value">{{ (saleSummary?.totalRevenue ?? 0) | currency }}</span>
              <span class="stat-label">Total Revenue</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon green"><mat-icon>receipt</mat-icon></span>
            <div class="stat-body">
              <span class="stat-value">{{ saleSummary?.totalSales ?? 0 }}</span>
              <span class="stat-label">Total Sales</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon orange"><mat-icon>payments</mat-icon></span>
            <div class="stat-body">
              <span class="stat-value">{{ (saleSummary?.outstanding ?? 0) | currency }}</span>
              <span class="stat-label">Outstanding</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon purple"><mat-icon>receipt_long</mat-icon></span>
            <div class="stat-body">
              <span class="stat-value">{{ (expenseSummary?.totalAmount ?? 0) | currency }}</span>
              <span class="stat-label">Total Expenses</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon teal"><mat-icon>inventory_2</mat-icon></span>
            <div class="stat-body">
              <span class="stat-value">{{ productCount }}</span>
              <span class="stat-label">Products</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon green"><mat-icon>point_of_sale</mat-icon></span>
            <div class="stat-body">
              <span class="stat-value">{{ cashSummary?.openSessions ?? 0 }}</span>
              <span class="stat-label">Open Registers</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon blue"><mat-icon>account_balance_wallet</mat-icon></span>
            <div class="stat-body">
              <span class="stat-value">{{ (saleSummary?.totalCollected ?? 0) | currency }}</span>
              <span class="stat-label">Collected</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon teal"><mat-icon>savings</mat-icon></span>
            <div class="stat-body">
              <span class="stat-value">{{ (cashSummary?.totalOpenFloat ?? 0) | currency }}</span>
              <span class="stat-label">Cash Float</span>
            </div>
          </div>
        </div>

        <!-- Recent Sales -->
        <div class="section">
          <div class="section-header">
            <h2>Recent Sales</h2>
            <a routerLink="/sales" class="view-all-link">View all <mat-icon>chevron_right</mat-icon></a>
          </div>

          @if (recentSales.length === 0) {
            <div class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <p>No sales recorded yet.</p>
              <button mat-raised-button color="primary" routerLink="/pos">Make a Sale</button>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="recentSales" class="data-table">
                <ng-container matColumnDef="invoice">
                  <th mat-header-cell *matHeaderCellDef>Invoice</th>
                  <td mat-cell *matCellDef="let s">
                    <span class="badge badge-blue">{{ s.invoiceNo }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let s">{{ s.transactionDate | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="contact">
                  <th mat-header-cell *matHeaderCellDef>Customer</th>
                  <td mat-cell *matCellDef="let s">{{ s.contact?.name ?? '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let s">
                    <span [class]="'badge badge-' + s.status">{{ s.status }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="payment">
                  <th mat-header-cell *matHeaderCellDef>Payment</th>
                  <td mat-cell *matCellDef="let s">
                    <span [class]="'badge badge-pay-' + s.paymentStatus">{{ s.paymentStatus }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef class="col-right">Amount</th>
                  <td mat-cell *matCellDef="let s" class="col-right amount-cell">{{ s.totalAmount | currency }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="saleColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: saleColumns;"></tr>
              </table>
            </div>
          }
        </div>

        <!-- Top Expense Categories -->
        @if ((expenseSummary?.topCategories?.length ?? 0) > 0) {
          <div class="section">
            <div class="section-header">
              <h2>Top Expense Categories</h2>
              <a routerLink="/expenses" class="view-all-link">View all <mat-icon>chevron_right</mat-icon></a>
            </div>
            <div class="category-list">
              @for (cat of expenseSummary?.topCategories; track cat.expenseCategoryId) {
                <div class="category-row">
                  <span class="category-name">{{ cat.categoryName ?? 'Uncategorized' }}</span>
                  <div class="category-bar-wrap">
                    <div class="category-bar" [style.width]="categoryBarWidth(cat._sum.totalAmount ?? 0) + '%'"></div>
                  </div>
                  <span class="category-amount">{{ (cat._sum.totalAmount ?? 0) | currency }}</span>
                </div>
              }
            </div>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a1a1a;
    }
    .subtitle {
      margin: 0;
      font-size: 0.9rem;
      color: #666;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* ── Loading ── */
    .loading-state {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #666;
      font-size: 0.9rem;
    }

    /* ── Stats Grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: #e2e8f0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    .stat-item {
      background: #fff;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
    }
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 8px;
      flex-shrink: 0;
    }
    .stat-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .stat-icon.blue   { background: #e3f2fd; color: #1976d2; }
    .stat-icon.green  { background: #e8f5e9; color: #388e3c; }
    .stat-icon.orange { background: #fff3e0; color: #f57c00; }
    .stat-icon.purple { background: #f3e5f5; color: #7b1fa2; }
    .stat-icon.teal   { background: #e0f2f1; color: #00796b; }

    .stat-body { display: flex; flex-direction: column; min-width: 0; }
    .stat-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stat-label {
      font-size: 0.78rem;
      color: #888;
      margin-top: 2px;
    }

    /* ── Section ── */
    .section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a1a;
    }
    .view-all-link {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 0.85rem;
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }
    .view-all-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .view-all-link:hover { text-decoration: underline; }

    /* ── Table ── */
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; }
    .data-table th {
      font-size: 0.78rem;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      font-size: 0.875rem;
      color: #1a1a1a;
      border-bottom: 1px solid #f0f0f0;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .col-right { text-align: right !important; }
    .amount-cell { font-weight: 600; }

    /* ── Badges ── */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-blue       { background: #e3f2fd; color: #1565c0; }
    .badge-final,
    .badge-completed  { background: #e8f5e9; color: #2e7d32; }
    .badge-draft      { background: #f5f5f5; color: #555; }
    .badge-pending    { background: #fff8e1; color: #f57f17; }
    .badge-pay-paid   { background: #e8f5e9; color: #2e7d32; }
    .badge-pay-due    { background: #fff3e0; color: #e65100; }
    .badge-pay-partial{ background: #fff8e1; color: #f57f17; }
    .badge-pay-overdue{ background: #ffebee; color: #c62828; }

    /* ── Empty state ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1.5rem;
      gap: 0.5rem;
      color: #9e9e9e;
    }
    .empty-state mat-icon { font-size: 3rem; width: 3rem; height: 3rem; }
    .empty-state p { margin: 0; font-size: 0.9rem; }

    /* ── Category bars ── */
    .category-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .category-row {
      display: grid;
      grid-template-columns: 180px 1fr 110px;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .category-row:last-child { border-bottom: none; }
    .category-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1a1a1a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .category-bar-wrap {
      background: #f0f0f0;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
    }
    .category-bar {
      height: 100%;
      background: #1976d2;
      border-radius: 4px;
      transition: width 0.4s ease;
    }
    .category-amount {
      text-align: right;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .dashboard-container { padding: 1rem; }
      .stats-grid { grid-template-columns: 1fr; }
      .category-row { grid-template-columns: 120px 1fr 80px; gap: 0.5rem; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private authService = inject(Auth);
  private roleService = inject(RoleService);
  private salesService = inject(SalesService);
  private expensesService = inject(ExpensesService);
  private cashRegisterService = inject(CashRegisterService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  currentUser = this.authService.getCurrentUser();

  isLoading = true;
  saleSummary: SaleSummary | null = null;
  expenseSummary: ExpenseSummary | null = null;
  cashSummary: CashRegisterSummary | null = null;
  productCount = 0;
  recentSales: SaleListItem[] = [];

  saleColumns = ['invoice', 'date', 'contact', 'status', 'payment', 'amount'];

  ngOnInit(): void {
    this.roleService.refreshUser();
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    forkJoin({
      sales: this.salesService.getSummary(),
      expenses: this.expensesService.getSummary(),
      cash: this.cashRegisterService.getSummary(),
      products: this.productService.getAllProducts(),
      recentSales: this.salesService.getSales({ limit: 5, page: 1 }),
    }).subscribe({
      next: ({ sales, expenses, cash, products, recentSales }) => {
        this.saleSummary = sales;
        this.expenseSummary = expenses;
        this.cashSummary = cash;
        this.productCount = products.length;
        this.recentSales = recentSales.data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  categoryBarWidth(amount: number): number {
    const max = Math.max(
      ...(this.expenseSummary?.topCategories?.map(c => c._sum.totalAmount ?? 0) ?? [1]),
      1
    );
    return Math.round((amount / max) * 100);
  }
}
