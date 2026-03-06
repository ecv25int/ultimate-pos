import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SalesService } from '../../../core/services/sales.service';
import { ProductService } from '../../../core/services/product.service';
import { ContactService } from '../../../core/services/contact.service';
import { Product } from '../../../core/models/product.model';
import { ContactListItem } from '../../../core/models/contact.model';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button mat-icon-button routerLink="/sales"><mat-icon>arrow_back</mat-icon></button>
          <h1>New Sale</h1>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <!-- Left: Header Info -->
          <mat-card>
            <mat-card-header><mat-card-title>Sale Details</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Customer (optional)</mat-label>
                <mat-select formControlName="contactId">
                  <mat-option [value]="null">Walk-in Customer</mat-option>
                  <mat-option *ngFor="let c of customers" [value]="c.id">
                    {{ c.name }} — {{ c.mobile }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Sale Date</mat-label>
                <input matInput [matDatepicker]="dp" formControlName="transactionDate" />
                <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
                <mat-datepicker #dp></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="draft">Draft</mat-option>
                  <mat-option value="final">Final</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Note</mat-label>
                <textarea matInput formControlName="note" rows="3"></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- Right: Payment -->
          <mat-card>
            <mat-card-header><mat-card-title>Payment</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Discount Type</mat-label>
                <mat-select formControlName="discountType">
                  <mat-option value="fixed">Fixed Amount</mat-option>
                  <mat-option value="percentage">Percentage (%)</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Discount Amount</mat-label>
                <input matInput type="number" min="0" formControlName="discountAmount" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tax Amount</mat-label>
                <input matInput type="number" min="0" formControlName="taxAmount" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Shipping Amount</mat-label>
                <input matInput type="number" min="0" formControlName="shippingAmount" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Amount Paid</mat-label>
                <input matInput type="number" min="0" formControlName="paidAmount" />
              </mat-form-field>

              <!-- Totals Preview -->
              <mat-divider></mat-divider>
              <div class="totals-preview">
                <div class="t-row"><span>Subtotal</span><strong>{{ lineSubtotal | number:'1.2-2' }}</strong></div>
                <div class="t-row"><span>Discount</span><strong>-{{ form.value.discountAmount | number:'1.2-2' }}</strong></div>
                <div class="t-row"><span>Tax</span><strong>{{ form.value.taxAmount | number:'1.2-2' }}</strong></div>
                <div class="t-row"><span>Shipping</span><strong>{{ form.value.shippingAmount | number:'1.2-2' }}</strong></div>
                <div class="t-row final"><span>Total</span><strong>{{ grandTotal | number:'1.2-2' }}</strong></div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Line Items -->
        <mat-card class="lines-card">
          <mat-card-header>
            <mat-card-title>Line Items</mat-card-title>
            <div class="card-actions">
              <button type="button" mat-stroked-button color="primary" (click)="addLine()">
                <mat-icon>add</mat-icon> Add Item
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="lines.length === 0" class="empty-lines">
              Click "Add Item" to add products to this sale.
            </div>

            <div formArrayName="lines">
              <div *ngFor="let line of lines.controls; let i = index"
                   [formGroupName]="i" class="line-row">

                <mat-form-field appearance="outline" class="product-field">
                  <mat-label>Product</mat-label>
                  <mat-select formControlName="productId" (selectionChange)="onProductSelect(i)">
                    <mat-option *ngFor="let p of products" [value]="p.id">
                      {{ p.name }} ({{ p.sku }})
                    </mat-option>
                  </mat-select>
                  @if (line.get('productId')?.invalid && line.get('productId')?.touched) {
                    <mat-error>Product is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="small-field">
                  <mat-label>Qty</mat-label>
                  <input matInput type="number" min="0.01" step="0.01"
                         formControlName="quantity" (input)="recalc()" />
                  @if (line.get('quantity')?.hasError('required') && line.get('quantity')?.touched) {
                    <mat-error>Quantity is required</mat-error>
                  }
                  @if (line.get('quantity')?.hasError('min') && line.get('quantity')?.touched) {
                    <mat-error>Must be greater than 0</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="small-field">
                  <mat-label>Unit Price</mat-label>
                  <input matInput type="number" min="0"
                         formControlName="unitPrice" (input)="recalc()" />
                  @if (line.get('unitPrice')?.hasError('min') && line.get('unitPrice')?.touched) {
                    <mat-error>Price must be ≥ 0</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="small-field">
                  <mat-label>Discount</mat-label>
                  <input matInput type="number" min="0"
                         formControlName="discountAmount" (input)="recalc()" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="small-field">
                  <mat-label>Tax</mat-label>
                  <input matInput type="number" min="0"
                         formControlName="taxAmount" (input)="recalc()" />
                </mat-form-field>

                <div class="line-total">
                  <span class="t-label">Total</span>
                  <strong>{{ getLineTotal(i) | number:'1.2-2' }}</strong>
                </div>

                <button type="button" mat-icon-button color="warn" (click)="removeLine(i)">
                  <mat-icon>remove_circle_outline</mat-icon>
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Submit -->
        <div class="submit-row">
          <button type="button" mat-stroked-button routerLink="/sales">Cancel</button>
          <button type="button" mat-stroked-button color="accent"
                  [disabled]="lines.length === 0 || saving"
                  (click)="saveAs('draft')">
            <mat-icon>drafts</mat-icon> Save as Draft
          </button>
          <button type="button" mat-stroked-button
                  [disabled]="lines.length === 0 || saving"
                  (click)="saveAs('quotation')">
            <mat-icon>request_quote</mat-icon> Save as Quotation
          </button>
          <button type="submit" mat-raised-button color="primary"
                  [disabled]="form.invalid || saving || lines.length === 0">
            <mat-icon>save</mat-icon> {{ saving ? 'Saving...' : 'Create Sale' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header > div { display: flex; align-items: center; gap: 12px; }
    .page-header h1 { margin: 0; font-size: 1.6rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .totals-preview { margin-top: 16px; }
    .t-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .t-row.final { font-size: 1.1rem; border-top: 1px solid #eee; padding-top: 10px; margin-top: 4px; }
    .lines-card { margin-bottom: 24px; }
    .lines-card mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-actions { margin-left: auto; }
    .empty-lines { padding: 24px; text-align: center; color: #999; }
    .line-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .product-field { flex: 2; min-width: 200px; }
    .small-field { flex: 1; min-width: 90px; }
    .line-total { text-align: right; min-width: 90px; }
    .t-label { display: block; font-size: 0.75rem; color: #666; }
    .submit-row { display: flex; justify-content: flex-end; gap: 12px; padding-bottom: 40px; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class SaleFormComponent implements OnInit {
  form!: FormGroup;
  products: Product[] = [];
  customers: ContactListItem[] = [];
  saving = false;
  lineSubtotal = 0;
  grandTotal = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private salesService: SalesService,
    private productService: ProductService,
    private contactService: ContactService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      contactId: [null],
      transactionDate: [new Date()],
      status: ['final'],
      discountType: ['fixed'],
      discountAmount: [0],
      taxAmount: [0],
      shippingAmount: [0],
      paidAmount: [0],
      note: [''],
      lines: this.fb.array([]),
    });

    this.form.valueChanges.subscribe(() => this.recalc());

    this.productService.getAllProducts().subscribe({
      next: (ps: Product[]) => (this.products = ps.filter((p: Product) => p.enableStock)),
    });

    this.contactService.getAll({ type: 'customer' }).subscribe({
      next: (res) => (this.customers = res),
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  addLine() {
    this.lines.push(
      this.fb.group({
        productId: [null, Validators.required],
        quantity: [1, [Validators.required, Validators.min(0.01)]],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        discountAmount: [0],
        taxAmount: [0],
        note: [''],
      }),
    );
  }

  removeLine(i: number) {
    this.lines.removeAt(i);
    this.recalc();
  }

  onProductSelect(i: number) {
    // Could auto-fill price here if products had price data
    this.recalc();
  }

  getLineTotal(i: number): number {
    const line = this.lines.at(i).value;
    const qty = +line.quantity || 0;
    const price = +line.unitPrice || 0;
    const disc = +line.discountAmount || 0;
    const tax = +line.taxAmount || 0;
    return qty * price - disc + tax;
  }

  recalc() {
    this.lineSubtotal = this.lines.controls.reduce((acc, _, i) => acc + this.getLineTotal(i), 0);
    const v = this.form.value;
    const disc = +v.discountAmount || 0;
    const tax = +v.taxAmount || 0;
    const ship = +v.shippingAmount || 0;
    this.grandTotal = this.lineSubtotal - disc + tax + ship;
  }

  onSubmit() {
    if (this.form.invalid || this.lines.length === 0) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;
    this.submitSale({ status: v.status, type: 'sale' });
  }

  saveAs(mode: 'draft' | 'quotation') {
    if (this.lines.length === 0) return;
    this.saving = true;
    this.submitSale({ status: mode === 'draft' ? 'draft' : 'pending', type: mode === 'quotation' ? 'quotation' : 'sale' });
  }

  private submitSale(overrides: { status: string; type: string }) {
    const v = this.form.value;
    const dto: any = {
      contactId: v.contactId || undefined,
      status: overrides.status,
      type: overrides.type,
      discountType: v.discountType,
      discountAmount: +v.discountAmount,
      taxAmount: +v.taxAmount,
      shippingAmount: +v.shippingAmount,
      paidAmount: +v.paidAmount,
      note: v.note || undefined,
      transactionDate: v.transactionDate ? new Date(v.transactionDate).toISOString() : undefined,
      lines: v.lines.map((l: any) => ({
        productId: l.productId,
        quantity: +l.quantity,
        unitPrice: +l.unitPrice,
        discountAmount: +l.discountAmount,
        taxAmount: +l.taxAmount,
        note: l.note || undefined,
      })),
    };
    this.salesService.createSale(dto).subscribe({
      next: (sale) => this.router.navigate(['/sales', sale.id]),
      error: () => { this.saving = false; },
    });
  }
}
