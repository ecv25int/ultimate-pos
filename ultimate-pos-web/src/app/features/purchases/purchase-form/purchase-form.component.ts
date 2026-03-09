import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchasesService } from '../../../core/services/purchases.service';
import { ContactService } from '../../../core/services/contact.service';
import { ProductService } from '../../../core/services/product.service';
import { CreatePurchaseDto, CreatePurchaseLineDto } from '../../../core/models/purchase.model';
import { MatIconModule } from '@angular/material/icon';
import { ContactListItem } from '../../../core/models/contact.model';

interface LineItem extends CreatePurchaseLineDto {
  productName?: string;
}

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">add_shopping_cart</mat-icon>
          <div>
            <h1>{{ isRequisition ? 'New Requisition' : 'New Purchase Order' }}</h1>
            <p class="subtitle">{{ isRequisition ? 'Save a requisition for later approval' : 'Create a new purchase from supplier' }}</p>
          </div>
        </div>
        <a routerLink="/purchases" class="btn btn-outline">Cancel</a>
      </div>

      <form (ngSubmit)="submit()" #form="ngForm">
        <div class="form-card">
          <h2 class="section-title">Order Details</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Supplier</label>
              <select [(ngModel)]="dto.contactId" name="contactId" class="form-control">
                <option [ngValue]="undefined">-- No Supplier --</option>
                <option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ref No</label>
              <input type="text" [(ngModel)]="dto.refNo" name="refNo" placeholder="Auto-generated if empty" class="form-control" />
            </div>
            <div class="form-group">
              <label>Purchase Date</label>
              <input type="date" [(ngModel)]="dto.purchaseDate" name="purchaseDate" class="form-control" />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select [(ngModel)]="dto.status" name="status" class="form-control">
                <option value="ordered">Ordered</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="form-group">
              <label>Payment Status</label>
              <select [(ngModel)]="dto.paymentStatus" name="paymentStatus" class="form-control">
                <option value="due">Due</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div class="form-group">
              <label>Amount Paid</label>
              <input type="number" [(ngModel)]="dto.paidAmount" name="paidAmount" min="0" step="0.01" class="form-control" (ngModelChange)="calcTotals()" />
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <div class="form-card">
          <div class="section-header">
            <h2 class="section-title">Items</h2>
            <button type="button" (click)="addLine()" class="btn btn-sm btn-outline">+ Add Item</button>
          </div>
          <table class="line-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Discount</th>
                <th>Tax</th>
                <th class="text-right">Line Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of lines; let i = index">
                <td>
                  <select [(ngModel)]="line.productId" [name]="'product_' + i" class="form-control" (ngModelChange)="onProductChange(i)" required #productSel="ngModel">
                    <option [ngValue]="0">-- Select Product --</option>
                    <option *ngFor="let p of products" [value]="p.id">{{ p.name }}</option>
                  </select>
                  <small *ngIf="productSel.invalid && productSel.touched" class="field-error">Product is required</small>
                </td>
                <td>
                  <input type="number" [(ngModel)]="line.quantity" [name]="'qty_' + i" min="1" class="form-control sm" (ngModelChange)="calcLine(i)" required #qtySel="ngModel" />
                  <small *ngIf="qtySel.errors?.['min'] && qtySel.touched" class="field-error">Must be ≥ 1</small>
                </td>
                <td><input type="number" [(ngModel)]="line.unitCostAfter" [name]="'cost_' + i" min="0" step="0.01" class="form-control sm" (ngModelChange)="calcLine(i)" /></td>
                <td><input type="number" [(ngModel)]="line.discountAmount" [name]="'disc_' + i" min="0" step="0.01" class="form-control sm" (ngModelChange)="calcLine(i)" /></td>
                <td><input type="number" [(ngModel)]="line.taxAmount" [name]="'tax_' + i" min="0" step="0.01" class="form-control sm" (ngModelChange)="calcLine(i)" /></td>
                <td class="text-right">{{ lineTotal(i) | number:'1.2-2' }}</td>
                <td><button type="button" (click)="removeLine(i)" class="btn-icon">✕</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="form-card totals-card">
          <div class="totals-grid">
            <div class="form-group">
              <label>Extra Discount</label>
              <input type="number" [(ngModel)]="dto.discountAmount" name="discount" min="0" step="0.01" class="form-control" (ngModelChange)="calcTotals()" />
            </div>
            <div class="form-group">
              <label>Tax</label>
              <input type="number" [(ngModel)]="dto.taxAmount" name="tax" min="0" step="0.01" class="form-control" (ngModelChange)="calcTotals()" />
            </div>
            <div class="form-group">
              <label>Shipping</label>
              <input type="number" [(ngModel)]="dto.shippingAmount" name="shipping" min="0" step="0.01" class="form-control" (ngModelChange)="calcTotals()" />
            </div>
          </div>
          <div class="total-summary">
            <div class="total-row"><span>Subtotal:</span><span>{{ subtotal | number:'1.2-2' }}</span></div>
            <div class="total-row"><span>Discount:</span><span>- {{ (dto.discountAmount || 0) | number:'1.2-2' }}</span></div>
            <div class="total-row"><span>Tax:</span><span>+ {{ (dto.taxAmount || 0) | number:'1.2-2' }}</span></div>
            <div class="total-row"><span>Shipping:</span><span>+ {{ (dto.shippingAmount || 0) | number:'1.2-2' }}</span></div>
            <div class="total-row grand"><span>Grand Total:</span><span>{{ grandTotal | number:'1.2-2' }}</span></div>
          </div>
        </div>

        <div class="form-group">
          <label>Note</label>
          <textarea [(ngModel)]="dto.note" name="note" rows="3" placeholder="Optional note..." class="form-control"></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="submitting || lines.length === 0">
            {{ submitting ? 'Saving...' : 'Create Purchase' }}
          </button>
          <span *ngIf="error" class="error-msg">{{ error }}</span>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-title { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    .page-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 0; color: #6b7280; }
    .form-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .section-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
    .form-group label { font-size: 13px; font-weight: 500; color: #374151; }
    .form-control { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 100%; box-sizing: border-box; }
    .form-control.sm { width: 90px; }
    .line-table { width: 100%; border-collapse: collapse; }
    .line-table th, .line-table td { padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    .line-table th { font-weight: 600; color: #374151; }
    .text-right { text-align: right; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #ef4444; font-size: 16px; }
    .totals-card .totals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
    .total-summary { border-top: 1px solid #e5e7eb; padding-top: 12px; max-width: 320px; margin-left: auto; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
    .total-row.grand { font-weight: 700; font-size: 16px; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
    .form-actions { display: flex; align-items: center; gap: 16px; margin-top: 8px; }
    .error-msg { color: #ef4444; font-size: 14px; }
    .btn { padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
    .btn-primary { background: #4f46e5; color: #fff; }
    .btn-outline { background: transparent; border: 1px solid #d1d5db; color: #374151; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-sm { padding: 6px 12px; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .field-error { color: #ef4444; font-size: 12px; margin-top: 2px; }
  `],
})
export class PurchaseFormComponent implements OnInit {
  suppliers: ContactListItem[] = [];
  products: any[] = [];
  lines: LineItem[] = [];
  subtotal = 0;
  grandTotal = 0;
  submitting = false;
  error = '';
  isRequisition = false;

  dto: CreatePurchaseDto = {
    status: 'ordered',
    paymentStatus: 'due',
    taxAmount: 0,
    discountAmount: 0,
    shippingAmount: 0,
    paidAmount: 0,
    purchaseDate: new Date().toISOString().substring(0, 10),
    lines: [],
  };

  constructor(
    private purchasesService: PurchasesService,
    private contactService: ContactService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.isRequisition = this.route.snapshot.queryParamMap.get('type') === 'requisition';
    if (this.isRequisition) this.dto.type = 'requisition';
    this.contactService.getAll({ type: 'supplier' }).subscribe({ next: s => this.suppliers = s });
    this.productService.getAllProducts().subscribe({ next: p => this.products = p });
  }

  addLine() {
    this.lines.push({ productId: 0, quantity: 1, unitCostBefore: 0, unitCostAfter: 0, discountAmount: 0, taxAmount: 0 });
  }

  removeLine(i: number) {
    this.lines.splice(i, 1);
    this.calcTotals();
  }

  onProductChange(i: number) {
    const p = this.products.find(x => x.id === this.lines[i].productId);
    if (p) {
      this.lines[i].productName = p.name;
      this.lines[i].unitCostBefore = +p.purchasePrice || 0;
      this.lines[i].unitCostAfter = +p.purchasePrice || 0;
    }
    this.calcLine(i);
  }

  calcLine(i: number) {
    this.calcTotals();
  }

  lineTotal(i: number): number {
    const l = this.lines[i];
    return (l.quantity * l.unitCostAfter) - (l.discountAmount || 0) + (l.taxAmount || 0);
  }

  calcTotals() {
    this.subtotal = this.lines.reduce((s, _, i) => s + this.lineTotal(i), 0);
    this.grandTotal = this.subtotal
      - (this.dto.discountAmount || 0)
      + (this.dto.taxAmount || 0)
      + (this.dto.shippingAmount || 0);
  }

  submit() {
    if (this.lines.length === 0) return;
    this.submitting = true;
    this.error = '';
    this.dto.lines = this.lines.map(l => ({
      productId: l.productId,
      quantity: l.quantity,
      unitCostBefore: l.unitCostBefore,
      unitCostAfter: l.unitCostAfter,
      discountAmount: l.discountAmount || 0,
      taxAmount: l.taxAmount || 0,
      note: l.note,
    }));
    this.purchasesService.create(this.dto).subscribe({
      next: p => this.router.navigate(['/purchases', p.id]),
      error: err => { this.error = err?.error?.message || 'Failed to create purchase'; this.submitting = false; },
    });
  }
}
