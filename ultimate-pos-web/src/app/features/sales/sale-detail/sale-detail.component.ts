import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SalesService } from '../../../core/services/sales.service';
import { Sale } from '../../../core/models/sale.model';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="page-container" *ngIf="sale; else loading">
      <div class="page-header">
        <div>
          <button mat-icon-button routerLink="/sales">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ sale.invoiceNo }}</h1>
          <span class="badge" [class]="'badge-' + sale.status">{{ sale.status }}</span>
          <span class="badge ml" [class]="'badge-pay-' + sale.paymentStatus">{{ sale.paymentStatus }}</span>
        </div>
        <div>
          <button mat-stroked-button (click)="printInvoice()" style="margin-right:8px">
            <mat-icon>print</mat-icon> Print Invoice
          </button>
          <button mat-stroked-button color="accent" (click)="toggleReturnForm()" style="margin-right:8px"
            *ngIf="sale.type !== 'sale_return'">
            <mat-icon>keyboard_return</mat-icon> Create Return
          </button>
          <button mat-stroked-button color="warn" (click)="deleteSale()">
            <mat-icon>delete</mat-icon> Delete
          </button>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Left: Info -->
        <mat-card>
          <mat-card-header><mat-card-title>Sale Info</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="info-row"><span>Date</span><strong>{{ sale.transactionDate | date:'medium' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Customer</span><strong>{{ sale.contact?.name ?? 'Walk-in' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Mobile</span><strong>{{ sale.contact?.mobile ?? '—' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Note</span><strong>{{ sale.note ?? '—' }}</strong></div>
          </mat-card-content>
        </mat-card>

        <!-- Right: Totals -->
        <mat-card>
          <mat-card-header><mat-card-title>Payment Summary</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="info-row"><span>Subtotal</span><strong>{{ getSubtotal() | number:'1.2-2' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Discount</span><strong>-{{ sale.discountAmount | number:'1.2-2' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Tax</span><strong>{{ sale.taxAmount | number:'1.2-2' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Shipping</span><strong>{{ sale.shippingAmount | number:'1.2-2' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row total-row"><span>Total</span><strong>{{ sale.totalAmount | number:'1.2-2' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Paid</span><strong class="paid">{{ sale.paidAmount | number:'1.2-2' }}</strong></div>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Due</span><strong class="due">{{ getDue() | number:'1.2-2' }}</strong></div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Line Items -->
      <mat-card class="mt">
        <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="sale.lines">
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Product</th>
              <td mat-cell *matCellDef="let l">{{ l.product?.name }}</td>
            </ng-container>
            <ng-container matColumnDef="sku">
              <th mat-header-cell *matHeaderCellDef>SKU</th>
              <td mat-cell *matCellDef="let l">{{ l.product?.sku }}</td>
            </ng-container>
            <ng-container matColumnDef="qty">
              <th mat-header-cell *matHeaderCellDef>Qty</th>
              <td mat-cell *matCellDef="let l">{{ l.quantity }}</td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Unit Price</th>
              <td mat-cell *matCellDef="let l">{{ l.unitPrice | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="discount">
              <th mat-header-cell *matHeaderCellDef>Discount</th>
              <td mat-cell *matCellDef="let l">{{ l.discountAmount | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="tax">
              <th mat-header-cell *matHeaderCellDef>Tax</th>
              <td mat-cell *matCellDef="let l">{{ l.taxAmount | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Line Total</th>
              <td mat-cell *matCellDef="let l"><strong>{{ l.lineTotal | number:'1.2-2' }}</strong></td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Return Form -->
      <mat-card class="mt" *ngIf="showReturnForm">
        <mat-card-header>
          <mat-icon mat-card-avatar>keyboard_return</mat-icon>
          <mat-card-title>Create Return</mat-card-title>
          <mat-card-subtitle>Select items and quantities to return</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="returnLines" style="width:100%;margin-bottom:16px">
            <ng-container matColumnDef="include">
              <th mat-header-cell *matHeaderCellDef>Include</th>
              <td mat-cell *matCellDef="let l">
                <input type="checkbox" [(ngModel)]="l.included" />
              </td>
            </ng-container>
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Product</th>
              <td mat-cell *matCellDef="let l">{{ l.productName }}</td>
            </ng-container>
            <ng-container matColumnDef="orig">
              <th mat-header-cell *matHeaderCellDef>Orig Qty</th>
              <td mat-cell *matCellDef="let l">{{ l.origQty }}</td>
            </ng-container>
            <ng-container matColumnDef="qty">
              <th mat-header-cell *matHeaderCellDef>Return Qty</th>
              <td mat-cell *matCellDef="let l">
                <input type="number" [(ngModel)]="l.quantity" min="0.01" [max]="l.origQty"
                  style="width:80px;padding:4px;border:1px solid #ccc;border-radius:4px" />
              </td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Unit Price</th>
              <td mat-cell *matCellDef="let l">{{ l.unitPrice | number:'1.2-2' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="returnColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: returnColumns;"></tr>
          </table>

          <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px">
            <mat-label>Return Note</mat-label>
            <textarea matInput [(ngModel)]="returnNote" rows="2"></textarea>
          </mat-form-field>

          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button mat-button (click)="showReturnForm=false">Cancel</button>
            <button mat-raised-button color="warn" (click)="submitReturn()" [disabled]="savingReturn">
              <mat-spinner *ngIf="savingReturn" diameter="18"></mat-spinner>
              <span *ngIf="!savingReturn">Submit Return</span>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

    </div>

    <ng-template #loading>
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    </ng-template>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header > div:first-child { display: flex; align-items: center; gap: 12px; }
    .page-header h1 { margin: 0; font-size: 1.6rem; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 500; text-transform: capitalize; }
    .badge-draft { background: #f5f5f5; color: #666; }
    .badge-final { background: #e3f2fd; color: #1565c0; }
    .badge-pending { background: #fff3e0; color: #e65100; }
    .badge-completed { background: #e8f5e9; color: #1b5e20; }
    .badge-pay-due { background: #ffebee; color: #c62828; }
    .badge-pay-partial { background: #fff3e0; color: #e65100; }
    .badge-pay-paid { background: #e8f5e9; color: #1b5e20; }
    .badge-pay-overdue { background: #fce4ec; color: #880e4f; }
    .ml { margin-left: 4px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; }
    .total-row strong { font-size: 1.1rem; }
    .paid { color: #388e3c; }
    .due { color: #d32f2f; }
    .mt { margin-top: 0; }
    table { width: 100%; }
    .loading-container { display: flex; justify-content: center; padding: 80px; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `],
})
export class SaleDetailComponent implements OnInit {
  sale: Sale | null = null;
  lineColumns = ['product', 'sku', 'qty', 'price', 'discount', 'tax', 'total'];

  showReturnForm = false;
  returnLines: { productId: number; productName: string; origQty: number; quantity: number; unitPrice: number; included: boolean }[] = [];
  returnColumns = ['include', 'product', 'orig', 'qty', 'price'];
  returnNote = '';
  savingReturn = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salesService: SalesService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.salesService.getSaleById(id).subscribe({ next: (s) => (this.sale = s) });
  }

  getSubtotal(): number {
    if (!this.sale) return 0;
    return this.sale.lines.reduce((acc, l) => acc + +l.lineTotal, 0);
  }

  getDue(): number {
    if (!this.sale) return 0;
    return +this.sale.totalAmount - +this.sale.paidAmount;
  }

  printInvoice() {
    if (!this.sale) return;
    this.salesService.getInvoice(this.sale.id).subscribe({
      next: (data) => {
        const b = data.business;
        const s = data.sale;
        const linesHtml = (s.lines ?? []).map((l: any) => `
          <tr>
            <td>${l.product?.name ?? '—'}</td>
            <td>${l.product?.sku ?? '—'}</td>
            <td style="text-align:right">${Number(l.quantity).toFixed(2)}</td>
            <td style="text-align:right">${Number(l.unitPrice).toFixed(2)}</td>
            <td style="text-align:right">${Number(l.lineTotal).toFixed(2)}</td>
          </tr>`).join('');
        const paymentsHtml = (s.payments ?? []).map((p: any) => `
          <tr>
            <td>${p.method}</td>
            <td>${new Date(p.paymentDate).toLocaleDateString()}</td>
            <td style="text-align:right">${Number(p.amount).toFixed(2)}</td>
            <td>${p.referenceNo ?? ''}</td>
          </tr>`).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
          <title>Invoice ${s.invoiceNo}</title>
          <style>
            body{font-family:Arial,sans-serif;margin:32px;color:#222}
            h1{margin:0 0 4px}h2{margin:0;font-size:1rem;color:#555}
            .header{display:flex;justify-content:space-between;margin-bottom:24px}
            .biz-info{text-align:right;font-size:0.85rem;color:#555}
            table{width:100%;border-collapse:collapse;margin-bottom:16px}
            th,td{padding:8px 10px;border-bottom:1px solid #eee;font-size:0.9rem}
            th{background:#f5f5f5;text-align:left}
            .totals{text-align:right;margin-top:8px}
            .totals td{border:none;padding:4px 10px}
            .due{color:#c62828;font-weight:700}
          </style>
        </head><body>
          <div class="header">
            <div><h1>INVOICE</h1><h2>${s.invoiceNo}</h2>
              <p style="font-size:0.85rem;color:#555">Date: ${new Date(s.transactionDate).toLocaleDateString()}</p>
              <p style="font-size:0.85rem"><strong>Customer:</strong> ${s.contact?.name ?? 'Walk-in'}</p>
            </div>
            <div class="biz-info">
              <strong>${b?.name ?? ''}</strong><br>
              ${b?.email ?? ''}<br>${b?.phone ?? ''}<br>${b?.address ?? ''}
            </div>
          </div>
          <table><thead><tr><th>Product</th><th>SKU</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${linesHtml}</tbody></table>
          <div class="totals"><table style="width:320px;margin-left:auto">
            <tr><td>Subtotal</td><td style="text-align:right">${Number(s.subtotal).toFixed(2)}</td></tr>
            <tr><td>Tax</td><td style="text-align:right">${Number(s.taxAmount ?? 0).toFixed(2)}</td></tr>
            <tr><td>Discount</td><td style="text-align:right">${Number(s.discountAmount ?? 0).toFixed(2)}</td></tr>
            <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${Number(s.totalAmount).toFixed(2)}</strong></td></tr>
            <tr><td>Paid</td><td style="text-align:right">${Number(s.paidAmount).toFixed(2)}</td></tr>
            <tr class="due"><td><strong>Balance Due</strong></td><td style="text-align:right"><strong>${Number(s.due).toFixed(2)}</strong></td></tr>
          </table></div>
          ${paymentsHtml ? '<h3 style="margin-top:24px">Payments</h3><table><thead><tr><th>Method</th><th>Date</th><th style="text-align:right">Amount</th><th>Reference</th></tr></thead><tbody>' + paymentsHtml + '</tbody></table>' : ''}
        </body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); w.print(); }
      },
      error: (err) =>
        this.snackBar.open(err?.error?.message ?? 'Could not load invoice.', 'Close', { duration: 5000 }),
    });
  }

  toggleReturnForm() {
    if (!this.sale) return;
    this.showReturnForm = !this.showReturnForm;
    if (this.showReturnForm) {
      this.returnLines = this.sale.lines.map((l: any) => ({
        productId: l.productId,
        productName: l.product?.name ?? '—',
        origQty: +l.quantity,
        quantity: +l.quantity,
        unitPrice: +l.unitPrice,
        included: true,
      }));
      this.returnNote = '';
    }
  }

  submitReturn() {
    if (!this.sale) return;
    const lines = this.returnLines
      .filter(l => l.included && l.quantity > 0)
      .map(l => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice }));
    if (!lines.length) {
      this.snackBar.open('Select at least one line to return.', 'Close', { duration: 3000 });
      return;
    }
    this.savingReturn = true;
    this.salesService.createReturn(this.sale.id, { lines, note: this.returnNote }).subscribe({
      next: () => {
        this.snackBar.open('Return created successfully.', 'OK', { duration: 3000 });
        this.showReturnForm = false;
        this.savingReturn = false;
        this.salesService.getSaleById(this.sale!.id).subscribe({ next: (s) => (this.sale = s) });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Error creating return.', 'Close', { duration: 5000 });
        this.savingReturn = false;
      },
    });
  }

  deleteSale() {
    if (!this.sale || !confirm('Delete this sale? This cannot be undone.')) return;
    this.salesService.deleteSale(this.sale.id).subscribe({
      next: () => this.router.navigate(['/sales']),
    });
  }
}
