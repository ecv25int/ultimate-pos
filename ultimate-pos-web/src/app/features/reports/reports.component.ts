import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsService } from '../../core/services/reports.service';
import { DashboardReport, RevenuePoint, TopProduct, StockReport } from '../../core/models/report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTabsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Reports</h1>
          <p>Business analytics and insights</p>
        </div>
      </div>

      <mat-tab-group animationDuration="150ms" (selectedTabChange)="onTabChange($event.index)">

        <!-- ① Dashboard -->
        <mat-tab label="Dashboard">
          <div class="tab-body">
            <div class="stats-grid" *ngIf="dashboard">
              <div class="stat-card blue">
                <span class="label">Total Sales</span>
                <span class="value">{{ dashboard.totalSales }}</span>
              </div>
              <div class="stat-card green">
                <span class="label">Total Revenue</span>
                <span class="value">\${{ dashboard.totalRevenue | number:'1.2-2' }}</span>
              </div>
              <div class="stat-card purple">
                <span class="label">Total Purchases</span>
                <span class="value">{{ dashboard.totalPurchases }}</span>
              </div>
              <div class="stat-card orange">
                <span class="label">Total Spend</span>
                <span class="value">\${{ dashboard.totalSpend | number:'1.2-2' }}</span>
              </div>
              <div class="stat-card yellow">
                <span class="label">Low Stock</span>
                <span class="value">{{ dashboard.lowStockCount }}</span>
              </div>
              <div class="stat-card red">
                <span class="label">Out of Stock</span>
                <span class="value">{{ dashboard.outOfStockCount }}</span>
              </div>
            </div>
            <div *ngIf="!dashboard" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>

            <div class="two-col" *ngIf="dashboard">
              <!-- Revenue chart -->
              <div class="report-card">
                <div class="report-header">
                  <h2>Revenue Trend</h2>
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
              </div>

              <!-- Top products -->
              <div class="report-card">
                <h2>Top Products</h2>
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
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- ② Sales -->
        <mat-tab label="Sales">
          <div class="tab-body">
            <div class="filter-bar">
              <div class="date-range">
                <label>From<input type="date" [(ngModel)]="salesFrom" class="date-input" /></label>
                <label>To<input type="date" [(ngModel)]="salesTo" class="date-input" /></label>
                <button mat-stroked-button (click)="loadSales()"><mat-icon>search</mat-icon> Apply</button>
                <button mat-stroked-button color="accent" (click)="exportReport('sales')">
                  <mat-icon>download</mat-icon> Export Excel
                </button>
                <button mat-stroked-button (click)="exportReportPdf('sales')">
                  <mat-icon>picture_as_pdf</mat-icon> Export PDF
                </button>
              </div>
            </div>
            <div *ngIf="salesLoading" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="salesReport && !salesLoading">
              <div class="summary-row">
                <div class="summary-chip">Orders: <strong>{{ salesReport.summary?._count?.id ?? 0 }}</strong></div>
                <div class="summary-chip">Revenue: <strong>\${{ salesReport.summary?._sum?.totalAmount | number:'1.2-2' }}</strong></div>
                <div class="summary-chip">Paid: <strong>\${{ salesReport.summary?._sum?.paidAmount | number:'1.2-2' }}</strong></div>
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
            </ng-container>
          </div>
        </mat-tab>

        <!-- ③ Purchases -->
        <mat-tab label="Purchases">
          <div class="tab-body">
            <div class="filter-bar">
              <div class="date-range">
                <label>From<input type="date" [(ngModel)]="purchasesFrom" class="date-input" /></label>
                <label>To<input type="date" [(ngModel)]="purchasesTo" class="date-input" /></label>
                <button mat-stroked-button (click)="loadPurchases()"><mat-icon>search</mat-icon> Apply</button>
                <button mat-stroked-button color="accent" (click)="exportReport('purchases')">
                  <mat-icon>download</mat-icon> Export Excel
                </button>
                <button mat-stroked-button (click)="exportReportPdf('purchases')">
                  <mat-icon>picture_as_pdf</mat-icon> Export PDF
                </button>
              </div>
            </div>
            <div *ngIf="purchasesLoading" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="purchasesReport && !purchasesLoading">
              <div class="summary-row">
                <div class="summary-chip">Orders: <strong>{{ purchasesReport.summary?._count?.id ?? 0 }}</strong></div>
                <div class="summary-chip">Spend: <strong>\${{ purchasesReport.summary?._sum?.totalAmount | number:'1.2-2' }}</strong></div>
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
            </ng-container>
          </div>
        </mat-tab>

        <!-- ④ Expenses -->
        <mat-tab label="Expenses">
          <div class="tab-body">
            <div class="filter-bar">
              <div class="date-range">
                <label>From<input type="date" [(ngModel)]="expensesFrom" class="date-input" /></label>
                <label>To<input type="date" [(ngModel)]="expensesTo" class="date-input" /></label>
                <button mat-stroked-button (click)="loadExpenses()"><mat-icon>search</mat-icon> Apply</button>
              </div>
              <button mat-stroked-button (click)="exportReportPdf('expenses')">
                <mat-icon>picture_as_pdf</mat-icon> Export PDF
              </button>
            </div>
            <div *ngIf="expensesLoading" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="expenseReport && !expensesLoading">
              <div class="summary-row">
                <div class="summary-chip">Transactions: <strong>{{ expenseReport.summary?.count ?? 0 }}</strong></div>
                <div class="summary-chip">Net: <strong>\${{ expenseReport.summary?.net | number:'1.2-2' }}</strong></div>
                <div class="summary-chip">Tax: <strong>\${{ expenseReport.summary?.tax | number:'1.2-2' }}</strong></div>
                <div class="summary-chip">Total: <strong>\${{ expenseReport.summary?.total | number:'1.2-2' }}</strong></div>
              </div>
              <!-- By category -->
              <div class="two-col" style="margin-top:16px">
                <div class="report-card">
                  <h2>By Category</h2>
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
                </div>
                <div class="report-card">
                  <h2>Recent Expenses</h2>
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
                </div>
              </div>
            </ng-container>
          </div>
        </mat-tab>

        <!-- ⑤ Profit & Loss -->
        <mat-tab label="P&amp;L">
          <div class="tab-body">
            <div class="filter-bar">
              <div class="date-range">
                <label>From<input type="date" [(ngModel)]="plFrom" class="date-input" /></label>
                <label>To<input type="date" [(ngModel)]="plTo" class="date-input" /></label>
                <button mat-stroked-button (click)="loadPL()"><mat-icon>search</mat-icon> Apply</button>
                <button mat-stroked-button (click)="loadCurrentMonth()">Current Month</button>
              </div>
              <button mat-stroked-button (click)="exportReportPdf('profit-loss')">
                <mat-icon>picture_as_pdf</mat-icon> Export PDF
              </button>
            </div>
            <div *ngIf="plLoading" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="plReport && !plLoading">
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
            </ng-container>
          </div>
        </mat-tab>

        <!-- ⑥ Stock -->
        <mat-tab label="Stock">
          <div class="tab-body">
            <div class="filter-bar">
              <button mat-stroked-button color="accent" (click)="exportReport('stock')">
                <mat-icon>download</mat-icon> Export Excel
              </button>
              <button mat-stroked-button (click)="exportReportPdf('stock')">
                <mat-icon>picture_as_pdf</mat-icon> Export PDF
              </button>
            </div>
            <div *ngIf="!stockReport" class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
            <ng-container *ngIf="stockReport">
              <div class="summary-row">
                <div class="summary-chip">Products: <strong>{{ stockReport.totalProducts }}</strong></div>
                <div class="summary-chip">Stock Value: <strong>\${{ stockReport.totalValue | number:'1.2-2' }}</strong></div>
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
                    <td class="text-right">\${{ ((item.currentStock ?? 0) * +(item.purchasePrice ?? 0)) | number:'1.2-2' }}</td>
                    <td><span class="badge" [ngClass]="stockStatus(item)">{{ stockStatusLabel(item) }}</span></td>
                  </tr>
                </tbody>
              </table>
            </ng-container>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
    .page-header p { margin: 0; color: #6b7280; }

    .tab-body { padding: 20px 0; }
    .filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .date-range { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .date-range label { font-size: 13px; color: #374151; display: flex; flex-direction: column; gap: 2px; }
    .date-input { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }

    .loading-wrap { display: flex; justify-content: center; padding: 48px; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #fff; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; border: 1px solid #e5e7eb; }
    .stat-card.blue   { border-left: 4px solid #3b82f6; }
    .stat-card.green  { border-left: 4px solid #10b981; }
    .stat-card.purple { border-left: 4px solid #8b5cf6; }
    .stat-card.orange { border-left: 4px solid #f97316; }
    .stat-card.yellow { border-left: 4px solid #f59e0b; }
    .stat-card.red    { border-left: 4px solid #ef4444; }
    .stat-card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
    .stat-card .value { font-size: 22px; font-weight: 700; color: #111827; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .report-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .report-card h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .report-header h2 { margin: 0; }

    .filter-select { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }

    .chart-container { overflow-x: auto; }
    .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 150px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 16px; }
    .bar { background: #4f46e5; width: 100%; min-height: 2px; border-radius: 2px 2px 0 0; }
    .bar-label { font-size: 8px; color: #9ca3af; margin-top: 4px; }

    .summary-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
    .summary-chip { background: #f3f4f6; border-radius: 9999px; padding: 6px 14px; font-size: 13px; }

    .mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .mini-table th, .mini-table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .mini-table th { font-weight: 600; color: #374151; background: #f9fafb; }
    .text-right { text-align: right; }

    .badge { padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; text-transform: capitalize; }
    .badge.paid    { background: #d1fae5; color: #065f46; }
    .badge.partial { background: #fef3c7; color: #92400e; }
    .badge.due     { background: #fee2e2; color: #991b1b; }
    .badge.ok      { background: #d1fae5; color: #065f46; }
    .badge.low     { background: #fef3c7; color: #92400e; }
    .badge.out     { background: #fee2e2; color: #991b1b; }

    .rank { display: inline-block; background: #e0e7ff; color: #4f46e5; border-radius: 9999px; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 11px; font-weight: 700; margin-right: 4px; }
    .empty { padding: 32px; text-align: center; color: #9ca3af; }

    /* P&L */
    .pl-table { max-width: 600px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
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

  constructor(private reportsService: ReportsService) {}

  ngOnInit() {
    this.loadDashboard();
    this.reportsService.getStockReport().subscribe({ next: sr => this.stockReport = sr });
  }

  loadDashboard() {
    this.reportsService.getDashboard().subscribe({ next: d => this.dashboard = d });
    this.loadRevenue();
    this.reportsService.getTopProducts(10).subscribe({ next: tp => this.topProducts = tp });
  }

  loadRevenue() {
    const days = this.revenueGroupBy === 'day' ? 30 : 365;
    this.reportsService.getRevenue(this.revenueGroupBy, days).subscribe({ next: d => this.revenueData = d });
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


