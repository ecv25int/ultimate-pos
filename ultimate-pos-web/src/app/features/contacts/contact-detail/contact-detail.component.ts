import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ContactService } from '../../../core/services/contact.service';
import { ReportsService } from '../../../core/services/reports.service';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>{{ ledger?.contact?.name ?? 'Contact Ledger' }}</h1>
          <p class="subtitle">{{ ledger?.contact?.mobile }}{{ ledger?.contact?.email ? ' · ' + ledger?.contact?.email : '' }}</p>
        </div>
        <div style="display:flex;gap:8px">
          <a routerLink="/contacts" mat-stroked-button>
            <mat-icon>arrow_back</mat-icon> Back
          </a>
          <a [routerLink]="['/contacts/edit', contactId]" mat-stroked-button>
            <mat-icon>edit</mat-icon> Edit
          </a>
        </div>
      </div>

      <ng-container *ngIf="loading">
        <div class="loading-state">Loading ledger...</div>
      </ng-container>

      <ng-container *ngIf="!loading && ledger">
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card sales">
            <div class="summary-label">Total Sales</div>
            <div class="summary-value">{{ ledger.totalSales | number:'1.2-2' }}</div>
            <div class="summary-sub">{{ ledger.salesCount }} transactions</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Sales Paid</div>
            <div class="summary-value paid">{{ ledger.totalSalesPaid | number:'1.2-2' }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Sales Due</div>
            <div class="summary-value due">{{ ledger.salesDue | number:'1.2-2' }}</div>
          </div>
          <div class="summary-card purchases">
            <div class="summary-label">Total Purchases</div>
            <div class="summary-value">{{ ledger.totalPurchases | number:'1.2-2' }}</div>
            <div class="summary-sub">{{ ledger.purchasesCount }} transactions</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Purchases Paid</div>
            <div class="summary-value paid">{{ ledger.totalPurchasesPaid | number:'1.2-2' }}</div>
          </div>
          <div class="summary-card net">
            <div class="summary-label">Net Balance</div>
            <div class="summary-value" [class.due]="ledger.netBalance > 0" [class.paid]="ledger.netBalance <= 0">
              {{ ledger.netBalance | number:'1.2-2' }}
            </div>
            <div class="summary-sub">Sales due − Purchases due</div>
          </div>
        </div>

        <!-- Recent Sales -->
        <div class="section-card">
          <h2>Recent Sales</h2>
          <ng-container *ngIf="ledger.recentSales?.length; else noSales">
            <table mat-table [dataSource]="ledger.recentSales" class="ledger-table">
              <ng-container matColumnDef="invoiceNo">
                <th mat-header-cell *matHeaderCellDef>Invoice No</th>
                <td mat-cell *matCellDef="let s">
                  <a [routerLink]="['/sales', s.id]" class="link">{{ s.invoiceNo }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let s">{{ s.transactionDate | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
                <td mat-cell *matCellDef="let s" class="text-right">{{ s.totalAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="paid">
                <th mat-header-cell *matHeaderCellDef class="text-right">Paid</th>
                <td mat-cell *matCellDef="let s" class="text-right paid">{{ s.paidAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="due">
                <th mat-header-cell *matHeaderCellDef class="text-right">Due</th>
                <td mat-cell *matCellDef="let s" class="text-right due">
                  {{ (s.totalAmount - s.paidAmount) | number:'1.2-2' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let s">{{ s.paymentStatus | titlecase }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="saleColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: saleColumns;"></tr>
            </table>
          </ng-container>
          <ng-template #noSales><p class="empty-msg">No sales found.</p></ng-template>
        </div>

        <!-- Recent Purchases -->
        <div class="section-card">
          <h2>Recent Purchases</h2>
          <ng-container *ngIf="ledger.recentPurchases?.length; else noPurchases">
            <table mat-table [dataSource]="ledger.recentPurchases" class="ledger-table">
              <ng-container matColumnDef="refNo">
                <th mat-header-cell *matHeaderCellDef>Ref No</th>
                <td mat-cell *matCellDef="let p">
                  <a [routerLink]="['/purchases', p.id]" class="link">{{ p.refNo }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let p">{{ p.purchaseDate | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
                <td mat-cell *matCellDef="let p" class="text-right">{{ p.totalAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="paid">
                <th mat-header-cell *matHeaderCellDef class="text-right">Paid</th>
                <td mat-cell *matCellDef="let p" class="text-right paid">{{ p.paidAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="due">
                <th mat-header-cell *matHeaderCellDef class="text-right">Due</th>
                <td mat-cell *matCellDef="let p" class="text-right due">
                  {{ (p.totalAmount - p.paidAmount) | number:'1.2-2' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">{{ p.paymentStatus | titlecase }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="purchaseColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: purchaseColumns;"></tr>
            </table>
          </ng-container>
          <ng-template #noPurchases><p class="empty-msg">No purchases found.</p></ng-template>
        </div>

        <!-- Overdue Invoices -->
        @if (overdue) {
          <div class="section-card overdue-section">
            <h2>
              <mat-icon style="vertical-align:middle;color:#dc2626;margin-right:6px">warning</mat-icon>
              Overdue / Unpaid Invoices
              @if (overdue.overdueCount > 0) {
                <span class="overdue-badge">{{ overdue.overdueCount }}</span>
              }
            </h2>

            @if (overdue.overdueSales?.length > 0) {
              <h3 class="sub-heading">Sales Outstanding</h3>
              <table mat-table [dataSource]="overdue.overdueSales" class="ledger-table">
                <ng-container matColumnDef="invoiceNo">
                  <th mat-header-cell *matHeaderCellDef>Invoice No</th>
                  <td mat-cell *matCellDef="let s"><a [routerLink]="['/sales', s.id]" class="link">{{ s.invoiceNo }}</a></td>
                </ng-container>
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let s">{{ s.transactionDate | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
                  <td mat-cell *matCellDef="let s" class="text-right">{{ s.totalAmount | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="paid">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Paid</th>
                  <td mat-cell *matCellDef="let s" class="text-right paid">{{ s.paidAmount | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="due">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Still Owed</th>
                  <td mat-cell *matCellDef="let s" class="text-right due">{{ (s.totalAmount - s.paidAmount) | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let s">{{ s.paymentStatus | titlecase }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="saleColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: saleColumns;"></tr>
              </table>
              <div class="overdue-total">Total owed on sales: <strong class="due">{{ overdue.totalSalesOwed | number:'1.2-2' }}</strong></div>
            }

            @if (overdue.overduePurchases?.length > 0) {
              <h3 class="sub-heading">Purchases Outstanding</h3>
              <table mat-table [dataSource]="overdue.overduePurchases" class="ledger-table">
                <ng-container matColumnDef="refNo">
                  <th mat-header-cell *matHeaderCellDef>Ref No</th>
                  <td mat-cell *matCellDef="let p"><a [routerLink]="['/purchases', p.id]" class="link">{{ p.refNo }}</a></td>
                </ng-container>
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let p">{{ p.purchaseDate | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
                  <td mat-cell *matCellDef="let p" class="text-right">{{ p.totalAmount | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="paid">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Paid</th>
                  <td mat-cell *matCellDef="let p" class="text-right paid">{{ p.paidAmount | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="due">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Still Owed</th>
                  <td mat-cell *matCellDef="let p" class="text-right due">{{ (p.totalAmount - p.paidAmount) | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let p">{{ p.paymentStatus | titlecase }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="purchaseColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: purchaseColumns;"></tr>
              </table>
              <div class="overdue-total">Total owed on purchases: <strong class="due">{{ overdue.totalPurchasesOwed | number:'1.2-2' }}</strong></div>
            }

            @if (overdue.overdueCount === 0) {
              <p class="empty-msg" style="color:#059669">✔ No outstanding invoices for this contact.</p>
            }
          </div>
        }

        <!-- Supplier Purchase History -->
        @if (supplierReport) {
          <div class="section-card supplier-history">
            <h2>
              <mat-icon style="vertical-align:middle;color:#7c3aed;margin-right:6px">local_shipping</mat-icon>
              Supplier Purchase History
            </h2>
            <div class="supplier-summary">
              <div class="sup-chip">Orders: <strong>{{ supplierReport.summary?.totalOrders ?? 0 }}</strong></div>
              <div class="sup-chip">Total Spend: <strong class="due">\${{ supplierReport.summary?.totalSpend | number:'1.2-2' }}</strong></div>
              <div class="sup-chip">Total Paid: <strong class="paid">\${{ supplierReport.summary?.totalPaid | number:'1.2-2' }}</strong></div>
              <div class="sup-chip">Still Owed: <strong [class.due]="supplierReport.summary?.totalDue > 0">\${{ supplierReport.summary?.totalDue | number:'1.2-2' }}</strong></div>
            </div>
            @if (supplierReport.purchases?.length) {
              <table mat-table [dataSource]="supplierReport.purchases" class="ledger-table" style="margin-top:16px">
                <ng-container matColumnDef="refNo">
                  <th mat-header-cell *matHeaderCellDef>Ref No</th>
                  <td mat-cell *matCellDef="let p"><a [routerLink]="['/purchases', p.id]" class="link">{{ p.referenceNo ?? p.id }}</a></td>
                </ng-container>
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let p">{{ p.purchaseDate | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="items">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Items</th>
                  <td mat-cell *matCellDef="let p" class="text-right">{{ p.lines?.length ?? '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
                  <td mat-cell *matCellDef="let p" class="text-right">{{ p.totalAmount | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="paid">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Paid</th>
                  <td mat-cell *matCellDef="let p" class="text-right paid">{{ p.paidAmount | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let p">
                    <span class="badge-status" [class]="'pstatus-' + (p.paymentStatus ?? 'unknown')">
                      {{ p.paymentStatus | titlecase }}
                    </span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="supplierColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: supplierColumns;"></tr>
              </table>
            } @else {
              <p class="empty-msg">No purchase history found.</p>
            }
          </div>
        }
      </ng-container>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 0; color: #6b7280; font-size: 14px; }
    .loading-state { text-align: center; padding: 60px; color: #9ca3af; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; }
    .summary-card.sales { border-left: 4px solid #3b82f6; }
    .summary-card.purchases { border-left: 4px solid #8b5cf6; }
    .summary-card.net { border-left: 4px solid #059669; }
    .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .summary-value { font-size: 22px; font-weight: 700; }
    .summary-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }
    .paid { color: #059669; }
    .due { color: #dc2626; }
    .section-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .section-card h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    .ledger-table { width: 100%; }
    .text-right { text-align: right; }
    .empty-msg { color: #9ca3af; text-align: center; padding: 20px 0; }
    .link { color: #2563eb; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .overdue-section { border-left: 4px solid #dc2626; }
    .overdue-badge { display: inline-flex; align-items: center; justify-content: center; background: #dc2626; color: #fff; border-radius: 12px; padding: 0 8px; font-size: 12px; font-weight: 600; margin-left: 8px; vertical-align: middle; }
    .sub-heading { font-size: 14px; color: #6b7280; margin: 16px 0 8px; font-weight: 500; }
    .overdue-total { text-align: right; margin-top: 8px; font-size: 14px; color: #374151; }
    .supplier-history { border-left: 4px solid #7c3aed; }
    .supplier-summary { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 4px; }
    .sup-chip { background: #f5f3ff; border-radius: 6px; padding: 6px 14px; font-size: 13px; color: #374151; }
    .badge-status { border-radius: 12px; padding: 2px 10px; font-size: 11px; font-weight: 600; }
    .pstatus-paid { background: #d1fae5; color: #065f46; }
    .pstatus-due,.pstatus-partial,.pstatus-overdue { background: #fee2e2; color: #991b1b; }
    @media (max-width: 768px) { .summary-grid { grid-template-columns: 1fr 1fr; } .supplier-summary { gap: 8px; } }
  `],
})
export class ContactDetailComponent implements OnInit {
  contactId!: number;
  ledger: any = null;
  overdue: any = null;
  supplierReport: any = null;
  loading = true;

  saleColumns = ['invoiceNo', 'date', 'total', 'paid', 'due', 'status'];
  purchaseColumns = ['refNo', 'date', 'total', 'paid', 'due', 'status'];
  supplierColumns = ['refNo', 'date', 'items', 'total', 'paid', 'status'];

  constructor(
    private route: ActivatedRoute,
    private contactService: ContactService,
    private reportsService: ReportsService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.contactId = +this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      ledger: this.contactService.getLedger(this.contactId),
      overdue: this.contactService.getOverdueInvoices(this.contactId),
      supplier: this.reportsService.getSupplierReport(this.contactId),
    }).subscribe({
      next: ({ ledger, overdue, supplier }) => {
        this.ledger = ledger;
        this.overdue = overdue;
        // Only show supplier history when there are purchases (contact is a supplier)
        if (supplier?.purchases?.length || supplier?.summary?.totalOrders > 0) {
          this.supplierReport = supplier;
        }
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to load contact data.', 'Close', { duration: 4000 });
        this.loading = false;
      },
    });
  }
}
