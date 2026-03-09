import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { PurchasesService } from '../../../core/services/purchases.service';
import { Purchase } from '../../../core/models/purchase.model';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatSnackBarModule, MatButtonModule, MatCheckboxModule, MatInputModule, MatFormFieldModule, MatIconModule],
  template: `
    <div class="page-container" *ngIf="purchase; else loading">
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">receipt</mat-icon>
          <div>
            <h1>{{ purchase.refNo }}</h1>
            <p class="subtitle">{{ purchase.purchaseDate | date:'longDate' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button *ngIf="purchase.type !== 'purchase_return'" mat-stroked-button (click)="toggleReturnForm()">
            {{ showReturnForm ? 'Cancel Return' : 'Create Return' }}
          </button>
          <a routerLink="/purchases" class="btn btn-outline">Back</a>
        </div>
      </div>

      <!-- Status badges -->
      <div class="badges-row">
        <span class="badge" [ngClass]="purchase.status">{{ purchase.status | titlecase }}</span>
        <span class="badge" [ngClass]="purchase.paymentStatus">{{ purchase.paymentStatus | titlecase }}</span>
        <span *ngIf="purchase.type === 'purchase_return'" class="badge return-badge">Return</span>
      </div>

      <div class="detail-grid">
        <!-- Order info -->
        <div class="detail-card">
          <h2>Order Information</h2>
          <dl>
            <dt>Supplier</dt><dd>{{ purchase.contact?.name || '—' }}</dd>
            <dt>Ref No</dt><dd>{{ purchase.refNo }}</dd>
            <dt>Purchase Date</dt><dd>{{ purchase.purchaseDate | date:'mediumDate' }}</dd>
            <dt>Note</dt><dd>{{ purchase.note || '—' }}</dd>
          </dl>
        </div>

        <!-- Payment summary -->
        <div class="detail-card">
          <h2>Payment Summary</h2>
          <dl>
            <dt>Subtotal</dt><dd>{{ subtotal | number:'1.2-2' }}</dd>
            <dt>Discount</dt><dd>- {{ purchase.discountAmount | number:'1.2-2' }}</dd>
            <dt>Tax</dt><dd>+ {{ purchase.taxAmount | number:'1.2-2' }}</dd>
            <dt>Shipping</dt><dd>+ {{ purchase.shippingAmount | number:'1.2-2' }}</dd>
            <dt class="grand">Grand Total</dt><dd class="grand">{{ purchase.totalAmount | number:'1.2-2' }}</dd>
            <dt>Paid</dt><dd>{{ purchase.paidAmount | number:'1.2-2' }}</dd>
            <dt class="due">Balance Due</dt><dd class="due">{{ (purchase.totalAmount - purchase.paidAmount) | number:'1.2-2' }}</dd>
          </dl>
        </div>
      </div>

      <!-- Lines -->
      <div class="detail-card full">
        <h2>Items</h2>
        <table class="line-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Cost</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Tax</th>
              <th class="text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let line of purchase.lines; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ line.productId }}</td>
              <td class="text-right">{{ line.quantity }}</td>
              <td class="text-right">{{ line.unitCostAfter | number:'1.2-2' }}</td>
              <td class="text-right">{{ line.discountAmount | number:'1.2-2' }}</td>
              <td class="text-right">{{ line.taxAmount | number:'1.2-2' }}</td>
              <td class="text-right">{{ line.lineTotal | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Return Form -->
      <div class="detail-card full return-panel" *ngIf="showReturnForm">
        <h2>Create Purchase Return</h2>
        <table class="line-table">
          <thead>
            <tr>
              <th style="width:48px">Include</th>
              <th>Product</th>
              <th class="text-right">Orig Qty</th>
              <th class="text-right" style="width:120px">Return Qty</th>
              <th class="text-right">Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rl of returnLines">
              <td><mat-checkbox [(ngModel)]="rl.included"></mat-checkbox></td>
              <td>{{ rl.productName }}</td>
              <td class="text-right">{{ rl.origQty }}</td>
              <td class="text-right">
                <input type="number" [(ngModel)]="rl.quantity" [min]="1" [max]="rl.origQty"
                  style="width:80px;text-align:right;border:1px solid #d1d5db;border-radius:4px;padding:4px 6px;"
                  [disabled]="!rl.included">
              </td>
              <td class="text-right">{{ rl.unitCost | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:16px">
          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>Note (optional)</mat-label>
            <textarea matInput [(ngModel)]="returnNote" rows="2"></textarea>
          </mat-form-field>
        </div>
        <div style="display:flex;gap:12px;margin-top:8px">
          <button mat-flat-button color="warn" (click)="submitReturn()" [disabled]="savingReturn">
            {{ savingReturn ? 'Saving…' : 'Submit Return' }}
          </button>
          <button mat-stroked-button (click)="toggleReturnForm()">Cancel</button>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading">Loading...</div>
    </ng-template>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .header-title { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    .page-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 0; color: #6b7280; }
    .badges-row { display: flex; gap: 8px; margin-bottom: 20px; }
    .badge { padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 500; }
    .received { background: #d1fae5; color: #065f46; }
    .ordered { background: #dbeafe; color: #1e40af; }
    .pending { background: #fef3c7; color: #92400e; }
    .cancelled { background: #fee2e2; color: #991b1b; }
    .paid { background: #d1fae5; color: #065f46; }
    .partial { background: #fef3c7; color: #92400e; }
    .due { background: #fee2e2; color: #991b1b; }
    .return-badge { background: #ede9fe; color: #5b21b6; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .detail-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .detail-card.full { grid-column: 1 / -1; }
    .return-panel { border-color: #f97316; margin-top: 20px; }
    .detail-card h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 16px; margin: 0; }
    dt { color: #6b7280; font-size: 13px; }
    dd { margin: 0; font-size: 14px; font-weight: 500; }
    dt.grand, dd.grand { font-size: 16px; font-weight: 700; }
    dt.due, dd.due { color: #dc2626; font-weight: 600; }
    .line-table { width: 100%; border-collapse: collapse; }
    .line-table th, .line-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .line-table th { font-weight: 600; color: #374151; background: #f9fafb; }
    .text-right { text-align: right; }
    .loading { padding: 48px; text-align: center; color: #9ca3af; }
    .btn { padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-outline { background: transparent; border: 1px solid #d1d5db; color: #374151; text-decoration: none; display: inline-flex; align-items: center; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
  `],
})
export class PurchaseDetailComponent implements OnInit {
  purchase: Purchase | null = null;

  showReturnForm = false;
  returnLines: { productId: number; productName: string; origQty: number; quantity: number; unitCost: number; included: boolean }[] = [];
  returnNote = '';
  savingReturn = false;

  get subtotal() {
    return this.purchase?.lines.reduce((s, l) => s + Number(l.lineTotal), 0) ?? 0;
  }

  constructor(
    private route: ActivatedRoute,
    private purchasesService: PurchasesService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.purchasesService.getById(id).subscribe({ next: p => this.purchase = p });
  }

  toggleReturnForm() {
    if (!this.purchase) return;
    this.showReturnForm = !this.showReturnForm;
    if (this.showReturnForm) {
      this.returnLines = this.purchase.lines.map((l: any) => ({
        productId: l.productId,
        productName: l.product?.name ?? `Product #${l.productId}`,
        origQty: +l.quantity,
        quantity: +l.quantity,
        unitCost: +l.unitCostAfter,
        included: true,
      }));
      this.returnNote = '';
    }
  }

  submitReturn() {
    if (!this.purchase) return;
    const lines = this.returnLines
      .filter(l => l.included && l.quantity > 0)
      .map(l => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost }));
    if (!lines.length) {
      this.snackBar.open('Select at least one line to return.', 'Close', { duration: 3000 });
      return;
    }
    this.savingReturn = true;
    this.purchasesService.createReturn(this.purchase.id, { lines, note: this.returnNote }).subscribe({
      next: () => {
        this.snackBar.open('Purchase return created.', 'OK', { duration: 3000 });
        this.showReturnForm = false;
        this.savingReturn = false;
        this.purchasesService.getById(this.purchase!.id).subscribe({ next: p => (this.purchase = p) });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Error creating return.', 'Close', { duration: 5000 });
        this.savingReturn = false;
      },
    });
  }
}


