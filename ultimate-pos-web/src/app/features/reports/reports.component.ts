import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ReportsService } from '../../core/services/reports.service';
import { DashboardReport, RevenuePoint, TopProduct, StockReport } from '../../core/models/report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTabsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatCardModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">bar_chart</mat-icon>
          <div>
            <h1>Reports</h1>
            <p>Business analytics and insights</p>
          </div>
        </div>
      </div>

      <mat-tab-group animationDuration="150ms" (selectedTabChange)="onTabChange($event.index)">

        <!-- ① Dashboard -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">dashboard</mat-icon> Dashboard</ng-template>
          <div class="tab-body">
            <div class="stats-row" *ngIf="dashboard">
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon blue">receipt</mat-icon>
                    <div>
                      <div class="stat-number">{{ dashboard.totalSales }}</div>
                      <div class="stat-label">Total Sales</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon green">trending_up</mat-icon>
                    <div>
                      <div class="stat-number">\${{ dashboard.totalRevenue | number:'1.2-2' }}</div>
                      <div class="stat-label">Total Revenue</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon purple">shopping_bag</mat-icon>
                    <div>
                      <div class="stat-number">{{ dashboard.totalPurchases }}</div>
                      <div class="stat-label">Total Purchases</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon orange">payments</mat-icon>
                    <div>
                      <div class="stat-number">\${{ dashboard.totalSpend | number:'1.2-2' }}</div>
                      <div class="stat-label">Total Spend</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon yellow">warning</mat-icon>
                    <div>
                      <div class="stat-number">{{ dashboard.lowStockCount }}</div>
                      <div class="stat-label">Low Stock</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon red">remove_circle</mat-icon>
                    <div>
                      <div class="stat-number">{{ dashboard.outOfStockCount }}</div>
                      <div class="stat-label">Out of Stock</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
            <div *ngIf="!dashboard" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>

            <div class="two-col" *ngIf="dashboard">
              <!-- Revenue chart -->
              <mat-card class="report-card">
                <mat-card-content>
                  <div class="report-header">
                    <div class="card-icon-header" style="margin-bottom:0">
                      <div class="card-avatar blue"><mat-icon>show_chart</mat-icon></div>
                      <h2>Revenue Trend</h2>
                    </div>
                    <select [(ngModel)]="revenueGroupBy" (ngModelChange)="loadRevenue()" class="filter-select">
                      <option value="day">Daily (30d)</option>
                      <option value="month">Monthly (12m)</option>
                    </select>
                  </div>
                  <div class="chart-container" *ngIf="revenueData.length > 0; else noRevenue">
                    <div class="bar-chart">
                      <div *ngFor="let pt of revenueData" class="bar-col" [title]="pt.period">
                        <div class="bar" [style.height.%]="barHeight(pt.revenue)" [title]="pt.revenue | number:'1.0-0'"></div>
                        <span class="bar-label">{{ formatPeriod(pt.period) }}</span>
                      </div>
                    </div>
                  </div>
                  <ng-template #noRevenue><div class="empty">No revenue data yet</div></ng-template>
                </mat-card-content>
              </mat-card>

              <!-- Top products -->
              <mat-card class="report-card">
                <mat-card-content>
                  <div class="card-icon-header">
                    <div class="card-avatar green"><mat-icon>leaderboard</mat-icon></div>
                    <h2>Top Products</h2>
                  </div>
                  <table class="mini-table" *ngIf="topProducts.length > 0; else noTop">
                    <thead><tr><th>Product</th><th class="text-right">Qty</th><th class="text-right">Revenue</th></tr></thead>
                    <tbody>
                      <tr *ngFor="let tp of topProducts; let i = index">
                        <td><span class="rank">{{ i+1 }}</span> {{ tp.product?.name || 'ID:'+tp.productId }}</td>
                        <td class="text-right">{{ tp.totalQty }}</td>
                        <td class="text-right">\${{ tp.totalRevenue | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <ng-template #noTop><div class="empty">No sales data yet</div></ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- ② Sales -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">receipt</mat-icon> Sales</ng-template>
          <div class="tab-body">
            <mat-card class="filter-card">
              <mat-card-content>
                <div class="filter-row">
                  <label class="date-label">From<input type="date" [(ngModel)]="salesFrom" class="date-input" /></label>
                  <label class="date-label">To<input type="date" [(ngModel)]="salesTo" class="date-input" /></label>
                  <button mat-stroked-button (click)="loadSales()"><mat-icon>search</mat-icon> Apply</button>
                  <button mat-stroked-button color="accent" (click)="exportReport('sales')">
                    <mat-icon>download</mat-icon> Export Excel
                  </button>
                  <button mat-stroked-button (click)="exportReportPdf('sales')">
                    <mat-icon>picture_as_pdf</mat-icon> Export PDF
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
            <div *ngIf="salesLoading" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="salesReport && !salesLoading">
              <div class="summary-row">
                <div class="summary-chip"><mat-icon class="chip-icon">receipt</mat-icon>Orders: <strong>{{ salesReport.summary?._count?.id ?? 0 }}</strong></div>
                <div class="summary-chip"><mat-icon class="chip-icon">trending_up</mat-icon>Revenue: <strong>\${{ salesReport.summary?._sum?.totalAmount | number:'1.2-2' }}</strong></div>
                <div class="summary-chip"><mat-icon class="chip-icon">payments</mat-icon>Paid: <strong>\${{ salesReport.summary?._sum?.paidAmount | number:'1.2-2' }}</strong></div>
              </div>
              <mat-card class="report-card">
                <mat-card-content>
                  <div class="card-icon-header">
                    <div class="card-avatar blue"><mat-icon>receipt</mat-icon></div>
                    <h2>Sales List</h2>
                  </div>
                  <table class="mini-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th><th>Date</th><th>Customer</th>
                        <th class="text-right">Total</th><th class="text-right">Paid</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let s of $any(salesReport?.sales)?.slice(0, 50)">
                        <td>{{ s.invoiceNo }}</td>
                        <td>{{ s.transactionDate | date:'dd/MM/yy' }}</td>
                        <td>{{ s.contact?.name ?? 'Walk-in' }}</td>
                        <td class="text-right">\${{ s.totalAmount | number:'1.2-2' }}</td>
                        <td class="text-right">\${{ s.paidAmount | number:'1.2-2' }}</td>
                        <td><span class="badge" [ngClass]="s.paymentStatus">{{ s.paymentStatus }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                  <div *ngIf="!salesReport.sales?.length" class="empty">No sales in this period</div>
                </mat-card-content>
              </mat-card>
            </ng-container>
          </div>
        </mat-tab>

        <!-- ③ Purchases -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">shopping_cart</mat-icon> Purchases</ng-template>
          <div class="tab-body">
            <mat-card class="filter-card">
              <mat-card-content>
                <div class="filter-row">
                  <label class="date-label">From<input type="date" [(ngModel)]="purchasesFrom" class="date-input" /></label>
                  <label class="date-label">To<input type="date" [(ngModel)]="purchasesTo" class="date-input" /></label>
                  <button mat-stroked-button (click)="loadPurchases()"><mat-icon>search</mat-icon> Apply</button>
                  <button mat-stroked-button color="accent" (click)="exportReport('purchases')">
                    <mat-icon>download</mat-icon> Export Excel
                  </button>
                  <button mat-stroked-button (click)="exportReportPdf('purchases')">
                    <mat-icon>picture_as_pdf</mat-icon> Export PDF
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
            <div *ngIf="purchasesLoading" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="purchasesReport && !purchasesLoading">
              <div class="summary-row">
                <div class="summary-chip"><mat-icon class="chip-icon">shopping_bag</mat-icon>Orders: <strong>{{ purchasesReport.summary?._count?.id ?? 0 }}</strong></div>
                <div class="summary-chip"><mat-icon class="chip-icon">attach_money</mat-icon>Spend: <strong>\${{ purchasesReport.summary?._sum?.totalAmount | number:'1.2-2' }}</strong></div>
              </div>
              <mat-card class="report-card">
                <mat-card-content>
                  <div class="card-icon-header">
                    <div class="card-avatar purple"><mat-icon>shopping_bag</mat-icon></div>
                    <h2>Purchases List</h2>
                  </div>
                  <table class="mini-table">
                    <thead>
                      <tr>
                        <th>Reference</th><th>Date</th><th>Supplier</th>
                        <th class="text-right">Total</th><th class="text-right">Paid</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let p of $any(purchasesReport?.purchases)?.slice(0, 50)">
                        <td>{{ p.referenceNo ?? p.id }}</td>
                        <td>{{ p.purchaseDate | date:'dd/MM/yy' }}</td>
                        <td>{{ p.contact?.name ?? '—' }}</td>
                        <td class="text-right">\${{ p.totalAmount | number:'1.2-2' }}</td>
                        <td class="text-right">\${{ p.paidAmount | number:'1.2-2' }}</td>
                        <td><span class="badge" [ngClass]="p.paymentStatus">{{ p.paymentStatus }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                  <div *ngIf="!purchasesReport.purchases?.length" class="empty">No purchases in this period</div>
                </mat-card-content>
              </mat-card>
            </ng-container>
          </div>
        </mat-tab>

        <!-- ④ Expenses -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">receipt_long</mat-icon> Expenses</ng-template>
          <div class="tab-body">
            <mat-card class="filter-card">
              <mat-card-content>
                <div class="filter-row">
                  <label class="date-label">From<input type="date" [(ngModel)]="expensesFrom" class="date-input" /></label>
                  <label class="date-label">To<input type="date" [(ngModel)]="expensesTo" class="date-input" /></label>
                  <button mat-stroked-button (click)="loadExpenses()"><mat-icon>search</mat-icon> Apply</button>
                  <button mat-stroked-button (click)="exportReportPdf('expenses')">
                    <mat-icon>picture_as_pdf</mat-icon> Export PDF
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
            <div *ngIf="expensesLoading" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="expenseReport && !expensesLoading">
              <div class="summary-row">
                <div class="summary-chip"><mat-icon class="chip-icon">receipt_long</mat-icon>Transactions: <strong>{{ expenseReport.summary?.count ?? 0 }}</strong></div>
                <div class="summary-chip"><mat-icon class="chip-icon">account_balance_wallet</mat-icon>Net: <strong>\${{ expenseReport.summary?.net | number:'1.2-2' }}</strong></div>
                <div class="summary-chip"><mat-icon class="chip-icon">percent</mat-icon>Tax: <strong>\${{ expenseReport.summary?.tax | number:'1.2-2' }}</strong></div>
                <div class="summary-chip"><mat-icon class="chip-icon">payments</mat-icon>Total: <strong>\${{ expenseReport.summary?.total | number:'1.2-2' }}</strong></div>
              </div>
              <!-- By category -->
              <div class="two-col">
                <mat-card class="report-card">
                  <mat-card-content>
                    <div class="card-icon-header">
                      <div class="card-avatar orange"><mat-icon>category</mat-icon></div>
                      <h2>By Category</h2>
                    </div>
                    <table class="mini-table">
                      <thead><tr><th>Category</th><th class="text-right">Count</th><th class="text-right">Total</th></tr></thead>
                      <tbody>
                        <tr *ngFor="let c of expenseReport.byCategory">
                          <td>{{ c.categoryName }}</td>
                          <td class="text-right">{{ c.count }}</td>
                          <td class="text-right">\${{ c.total | number:'1.2-2' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </mat-card-content>
                </mat-card>
                <mat-card class="report-card">
                  <mat-card-content>
                    <div class="card-icon-header">
                      <div class="card-avatar purple"><mat-icon>receipt_long</mat-icon></div>
                      <h2>Recent Expenses</h2>
                    </div>
                    <table class="mini-table">
                      <thead><tr><th>Date</th><th>Category</th><th class="text-right">Amount</th></tr></thead>
                      <tbody>
                        <tr *ngFor="let e of $any(expenseReport?.expenses)?.slice(0, 10)">
                          <td>{{ e.expenseDate | date:'dd/MM/yy' }}</td>
                          <td>{{ e.category?.name ?? '—' }}</td>
                          <td class="text-right">\${{ e.totalAmount | number:'1.2-2' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </mat-card-content>
                </mat-card>
              </div>
            </ng-container>
          </div>
        </mat-tab>

        <!-- ⑤ Profit & Loss -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">account_balance</mat-icon> P&amp;L</ng-template>
          <div class="tab-body">
            <mat-card class="filter-card">
              <mat-card-content>
                <div class="filter-row">
                  <label class="date-label">From<input type="date" [(ngModel)]="plFrom" class="date-input" /></label>
                  <label class="date-label">To<input type="date" [(ngModel)]="plTo" class="date-input" /></label>
                  <button mat-stroked-button (click)="loadPL()"><mat-icon>search</mat-icon> Apply</button>
                  <button mat-stroked-button (click)="loadCurrentMonth()"><mat-icon>today</mat-icon> Current Month</button>
                  <button mat-stroked-button (click)="exportReportPdf('profit-loss')">
                    <mat-icon>picture_as_pdf</mat-icon> Export PDF
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
            <div *ngIf="plLoading" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="plReport && !plLoading">
              <mat-card class="report-card pl-report-card">
                <mat-card-content>
                  <div class="card-icon-header">
                    <div class="card-avatar teal"><mat-icon>account_balance</mat-icon></div>
                    <h2>Profit &amp; Loss Statement</h2>
                  </div>
                  <div class="pl-table">
                    <div class="pl-row header"><span>INCOME</span></div>
                    <div class="pl-row"><span>Gross Revenue</span><span class="amount green">\${{ plReport.grossRevenue | number:'1.2-2' }}</span></div>
                    <div class="pl-row header"><span>COST OF GOODS SOLD</span></div>
                    <div class="pl-row"><span>Purchase Cost</span><span class="amount red">(\${{ plReport.totalCOGS | number:'1.2-2' }})</span></div>
                    <div class="pl-row subtotal"><span>Gross Profit</span><span class="amount" [ngClass]="plReport.grossProfit >= 0 ? 'green' : 'red'">\${{ plReport.grossProfit | number:'1.2-2' }}</span></div>
                    <div class="pl-row meta"><span>Gross Margin</span><span>{{ plReport.grossMarginPct | number:'1.1-1' }}%</span></div>
                    <div class="pl-row header"><span>OPERATING EXPENSES</span></div>
                    <div class="pl-row"><span>Total Expenses</span><span class="amount red">(\${{ plReport.totalExpenses | number:'1.2-2' }})</span></div>
                    <div class="pl-row total"><span>Net Profit</span><span class="amount" [ngClass]="plReport.netProfit >= 0 ? 'green' : 'red'">\${{ plReport.netProfit | number:'1.2-2' }}</span></div>
                    <div class="pl-row meta"><span>Net Margin</span><span>{{ plReport.netMarginPct | number:'1.1-1' }}%</span></div>
                  </div>
                </mat-card-content>
              </mat-card>
            </ng-container>
          </div>
        </mat-tab>

        <!-- ⑥ Stock -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">inventory_2</mat-icon> Stock</ng-template>
          <div class="tab-body">
            <mat-card class="filter-card">
              <mat-card-content>
                <div class="filter-row">
                  <button mat-stroked-button color="accent" (click)="exportReport('stock')">
                    <mat-icon>download</mat-icon> Export Excel
                  </button>
                  <button mat-stroked-button (click)="exportReportPdf('stock')">
                    <mat-icon>picture_as_pdf</mat-icon> Export PDF
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
            <div *ngIf="!stockReport" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="stockReport">
              <div class="summary-row">
                <div class="summary-chip"><mat-icon class="chip-icon">inventory_2</mat-icon>Products: <strong>{{ stockReport.totalProducts }}</strong></div>
                <div class="summary-chip"><mat-icon class="chip-icon">attach_money</mat-icon>Stock Value: <strong>\${{ stockReport.totalValue | number:'1.2-2' }}</strong></div>
              </div>
              <mat-card class="report-card">
                <mat-card-content>
                  <div class="card-icon-header">
                    <div class="card-avatar green"><mat-icon>inventory_2</mat-icon></div>
                    <h2>Stock Levels</h2>
                  </div>
                  <table class="mini-table">
                    <thead>
                      <tr>
                        <th>Product</th><th>Category</th>
                        <th class="text-right">Stock</th><th class="text-right">Alert</th>
                        <th class="text-right">Value</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of stockReport.products">
                        <td>{{ item.name }}</td>
                        <td>{{ item.category?.name || '—' }}</td>
                        <td class="text-right">{{ item.currentStock }} {{ item.unit?.abbreviation || '' }}</td>
                        <td class="text-right">{{ item.alertQuantity || 5 }}</td>
                        <td class="text-right">\${{ (item.currentStock * +(item.purchasePrice ?? 0)) | number:'1.2-2' }}</td>
                        <td><span class="badge" [ngClass]="stockStatus(item)">{{ stockStatusLabel(item) }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </mat-card-content>
              </mat-card>
            </ng-container>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    .page-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 0; color: #666; font-size: 0.9rem; }

    .tab-body { padding: 20px 0; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }

    /* Stats — matches Products .stats-row */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { border-radius: 12px; }
    .stat-content { display: flex; align-items: center; gap: 1rem; padding: 0.25rem 0; }
    .stat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; border-radius: 10px; padding: 0.5rem; flex-shrink: 0; }
    .stat-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .stat-icon.green  { color: #388e3c; background: #e8f5e9; }
    .stat-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .stat-icon.orange { color: #f57c00; background: #fff3e0; }
    .stat-icon.yellow { color: #f9a825; background: #fffde7; }
    .stat-icon.red    { color: #c62828; background: #ffebee; }
    .stat-number { font-size: 1.75rem; font-weight: 700; line-height: 1; color: #1a1a1a; }
    .stat-label { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }

    /* Filter card — matches Products .filter-card */
    .filter-card { margin-bottom: 1rem; border-radius: 12px; }
    .filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .date-label { font-size: 13px; color: #374151; display: flex; flex-direction: column; gap: 2px; }
    .date-input { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }

    /* Report cards — matches Products .table-card */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .report-card { border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
    .two-col .report-card { margin-bottom: 0; }
    .card-icon-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .card-icon-header h2 { margin: 0; font-size: 16px; font-weight: 600; }
    .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .report-header .card-icon-header { margin-bottom: 0; }
    .card-avatar { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; }
    .card-avatar mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
    .card-avatar.blue   { color: #1976d2; background: #e3f2fd; }
    .card-avatar.green  { color: #388e3c; background: #e8f5e9; }
    .card-avatar.orange { color: #f57c00; background: #fff3e0; }
    .card-avatar.purple { color: #7b1fa2; background: #f3e5f5; }
    .card-avatar.teal   { color: #00897b; background: #e0f2f1; }

    .filter-select { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }

    /* Chart */
    .chart-container { overflow-x: auto; margin-top: 16px; }
    .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 150px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 16px; }
    .bar { background: #1976d2; width: 100%; min-height: 2px; border-radius: 2px 2px 0 0; }
    .bar-label { font-size: 8px; color: #9ca3af; margin-top: 4px; }

    /* Summary chips */
    .summary-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
    .summary-chip { display: flex; align-items: center; gap: 6px; background: #f3f4f6; border-radius: 9999px; padding: 6px 14px; font-size: 13px; }
    .chip-icon { font-size: 1rem !important; width: 1rem !important; height: 1rem !important; color: #1976d2; }

    /* Tables */
    .mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .mini-table th, .mini-table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .mini-table th { font-weight: 600; color: #374151; background: #f9fafb; }
    .text-right { text-align: right; }

    /* Badges */
    .badge { padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; text-transform: capitalize; }
    .badge.paid    { background: #d1fae5; color: #065f46; }
    .badge.partial { background: #fef3c7; color: #92400e; }
    .badge.due     { background: #fee2e2; color: #991b1b; }
    .badge.ok      { background: #d1fae5; color: #065f46; }
    .badge.low     { background: #fef3c7; color: #92400e; }
    .badge.out     { background: #fee2e2; color: #991b1b; }

    .rank { display: inline-block; background: #e3f2fd; color: #1976d2; border-radius: 9999px; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 11px; font-weight: 700; margin-right: 4px; }
    .empty { padding: 32px; text-align: center; color: #9ca3af; }

    /* Tab icons */
    .tab-icon { font-size: 1.1rem !important; width: 1.1rem !important; height: 1.1rem !important; margin-right: 4px; vertical-align: middle; }

    /* P&L */
    .pl-report-card { max-width: 640px; }
    .pl-table { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-top: 8px; }
    .pl-row { display: flex; justify-content: space-between; padding: 10px 20px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .pl-row.header { background: #f9fafb; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
    .pl-row.subtotal { background: #f0fdf4; font-weight: 600; }
    .pl-row.total    { background: #f0f9ff; font-weight: 700; font-size: 15px; border-top: 2px solid #bfdbfe; }
    .pl-row.meta     { background: #fafafa; font-style: italic; color: #6b7280; font-size: 13px; }
    .amount.green { color: #059669; font-weight: 600; }
    .amount.red   { color: #dc2626; font-weight: 600; }
  `],
})
export class ReportsComponent implements OnInit {
  // Dashboard
  dashboard: DashboardReport | null = null;
  revenueData: RevenuePoint[] = [];
  topProducts: TopProduct[] = [];
  revenueGroupBy: 'day' | 'month' = 'day';

  // Sales tab
  salesFrom = ''; salesTo = ''; salesReport: any = null; salesLoading = false;

  // Purchases tab
  purchasesFrom = ''; purchasesTo = ''; purchasesReport: any = null; purchasesLoading = false;

  // Expenses tab
  expensesFrom = ''; expensesTo = ''; expenseReport: any = null; expensesLoading = false;

  // P&L tab
  plFrom = ''; plTo = ''; plReport: any = null; plLoading = false;

  // Stock tab
  stockReport: StockReport | null = null;

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.reportsService.getStockReport().subscribe({ next: sr => { this.stockReport = sr; this.cdr.detectChanges(); } });
  }

  loadDashboard() {
    this.reportsService.getDashboard().subscribe({ next: d => { this.dashboard = d; this.cdr.detectChanges(); } });
    this.loadRevenue();
    this.reportsService.getTopProducts(10).subscribe({ next: tp => { this.topProducts = tp; this.cdr.detectChanges(); } });
  }

  loadRevenue() {
    const days = this.revenueGroupBy === 'day' ? 30 : 365;
    this.reportsService.getRevenue(this.revenueGroupBy, days).subscribe({ next: d => { this.revenueData = d; this.cdr.detectChanges(); } });
  }

  loadSales() {
    this.salesLoading = true;
    this.reportsService.getSalesReport(this.salesFrom || undefined, this.salesTo || undefined)
      .subscribe({ next: r => { this.salesReport = r; this.salesLoading = false; }, error: () => { this.salesLoading = false; } });
  }

  loadPurchases() {
    this.purchasesLoading = true;
    this.reportsService.getPurchasesReport(this.purchasesFrom || undefined, this.purchasesTo || undefined)
      .subscribe({ next: r => { this.purchasesReport = r; this.purchasesLoading = false; }, error: () => { this.purchasesLoading = false; } });
  }

  loadExpenses() {
    this.expensesLoading = true;
    this.reportsService.getExpenseReport(this.expensesFrom || undefined, this.expensesTo || undefined)
      .subscribe({ next: r => { this.expenseReport = r; this.expensesLoading = false; }, error: () => { this.expensesLoading = false; } });
  }

  loadPL() {
    this.plLoading = true;
    this.reportsService.getProfitLoss(this.plFrom || undefined, this.plTo || undefined)
      .subscribe({ next: r => { this.plReport = r; this.plLoading = false; }, error: () => { this.plLoading = false; } });
  }

  loadCurrentMonth() {
    const now = new Date();
    this.plFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
    this.plTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().substring(0, 10);
    this.loadPL();
  }

  onTabChange(index: number) {
    if (index === 1 && !this.salesReport)    this.loadSales();
    if (index === 2 && !this.purchasesReport) this.loadPurchases();
    if (index === 3 && !this.expenseReport)  this.loadExpenses();
    if (index === 4 && !this.plReport)       { this.loadCurrentMonth(); }
  }

  exportReport(type: 'sales' | 'purchases' | 'stock') {
    this.reportsService.exportReport(
      type,
      type === 'sales' ? (this.salesFrom || undefined) : type === 'purchases' ? (this.purchasesFrom || undefined) : undefined,
      type === 'sales' ? (this.salesTo || undefined) : type === 'purchases' ? (this.purchasesTo || undefined) : undefined,
    );
  }

  exportReportPdf(type: 'sales' | 'purchases' | 'stock' | 'expenses' | 'profit-loss') {
    const from = type === 'sales' ? (this.salesFrom || undefined)
               : type === 'purchases' ? (this.purchasesFrom || undefined)
               : type === 'expenses' ? (this.expensesFrom || undefined)
               : type === 'profit-loss' ? (this.plFrom || undefined)
               : undefined;
    const to = type === 'sales' ? (this.salesTo || undefined)
             : type === 'purchases' ? (this.purchasesTo || undefined)
             : type === 'expenses' ? (this.expensesTo || undefined)
             : type === 'profit-loss' ? (this.plTo || undefined)
             : undefined;
    this.reportsService.exportReportPdf(type, from, to);
  }

  get maxRevenue() { return Math.max(...this.revenueData.map(p => p.revenue), 1); }
  barHeight(val: number): number { return (val / this.maxRevenue) * 100; }
  formatPeriod(p: string): string { return this.revenueGroupBy === 'day' ? p.substring(5) : p.substring(0, 7); }

  stockStatus(item: any): string {
    const s = item.currentStock ?? 0;
    if (s <= 0) return 'out';
    if (s <= (item.alertQuantity || 5)) return 'low';
    return 'ok';
  }
  stockStatusLabel(item: any): string {
    const s = this.stockStatus(item);
    return s === 'ok' ? 'OK' : s === 'low' ? 'Low' : 'Out';
  }
}


