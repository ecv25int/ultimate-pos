import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-stock-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="form-container">
      <div class="form-header">
        <button mat-icon-button routerLink="/inventory">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>Stock Entry</h1>
          <p class="subtitle">Record stock movement for a product</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="entry-form">
        <div class="form-grid">
          <!-- Product -->
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Product *</mat-label>
            <mat-select formControlName="productId">
              @for (p of products; track p.id) {
                <mat-option [value]="p.id">{{ p.name }} ({{ p.sku }})</mat-option>
              }
            </mat-select>
            @if (form.get('productId')?.hasError('required') && form.get('productId')?.touched) {
              <mat-error>Product is required</mat-error>
            }
          </mat-form-field>

          <!-- Entry type -->
          <mat-form-field appearance="outline">
            <mat-label>Entry Type *</mat-label>
            <mat-select formControlName="entryType">
              @for (t of entryTypes; track t.value) {
                <mat-option [value]="t.value">{{ t.label }}</mat-option>
              }
            </mat-select>
            @if (form.get('entryType')?.hasError('required') && form.get('entryType')?.touched) {
              <mat-error>Entry type is required</mat-error>
            }
          </mat-form-field>

          <!-- Quantity -->
          <mat-form-field appearance="outline">
            <mat-label>Quantity *</mat-label>
            <input matInput formControlName="quantity" type="number" step="0.0001" />
            <mat-hint>{{ quantityHint }}</mat-hint>
            @if (form.get('quantity')?.hasError('required') && form.get('quantity')?.touched) {
              <mat-error>Quantity is required</mat-error>
            }
            @if (form.get('quantity')?.hasError('min') && form.get('quantity')?.touched) {
              <mat-error>Quantity must be greater than 0</mat-error>
            }
          </mat-form-field>

          <!-- Unit Cost -->
          <mat-form-field appearance="outline">
            <mat-label>Unit Cost</mat-label>
            <input matInput formControlName="unitCost" type="number" step="0.01" min="0" />
            <span matPrefix>$&nbsp;</span>
            <mat-hint>Cost per unit (optional)</mat-hint>
          </mat-form-field>

          <!-- Reference No -->
          <mat-form-field appearance="outline">
            <mat-label>Reference No.</mat-label>
            <input matInput formControlName="referenceNo" placeholder="PO-001, INV-001..." />
          </mat-form-field>

          <!-- Note -->
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Note</mat-label>
            <textarea matInput formControlName="note" rows="3" placeholder="Reason for adjustment, supplier name, etc."></textarea>
          </mat-form-field>
        </div>

        <!-- Preview -->
        @if (form.get('entryType')?.value && form.get('quantity')?.value) {
          <div class="preview-box" [class.preview-in]="isStockIn" [class.preview-out]="!isStockIn">
            <mat-icon>{{ isStockIn ? 'arrow_downward' : 'arrow_upward' }}</mat-icon>
            <span>
              {{ isStockIn ? 'Stock IN' : 'Stock OUT' }} —
              {{ form.get('quantity')?.value | number:'1.0-4' }} unit(s)
              @if (form.get('unitCost')?.value) {
                @ {{ form.get('unitCost')?.value | number:'1.2-2' }} each
              }
            </span>
          </div>
        }

        <div class="form-actions">
          <button type="button" mat-stroked-button routerLink="/inventory">Cancel</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="submitting || form.invalid">
            @if (submitting) {
              <mat-spinner diameter="20" color="accent"></mat-spinner>
            } @else {
              Save Stock Entry
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
    .form-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 0; color: #666; font-size: 0.9rem; }

    .entry-form { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    mat-form-field { width: 100%; }
    .span-2 { grid-column: 1 / -1; }

    .preview-box { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 8px; margin: 16px 0; font-weight: 500; }
    .preview-in { background: #d1fae5; color: #065f46; }
    .preview-out { background: #fee2e2; color: #991b1b; }

    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 12px; }

    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class StockEntryFormComponent implements OnInit {
  form: FormGroup;
  products: Product[] = [];
  submitting = false;

  entryTypes = [
    { value: 'opening_stock',  label: 'Opening Stock' },
    { value: 'purchase_in',    label: 'Purchase In' },
    { value: 'adjustment_in',  label: 'Adjustment In' },
    { value: 'adjustment_out', label: 'Adjustment Out' },
    { value: 'sale_return',    label: 'Sale Return' },
  ];

  get isStockIn(): boolean {
    return ['opening_stock', 'purchase_in', 'adjustment_in', 'sale_return'].includes(
      this.form.get('entryType')?.value
    );
  }

  get quantityHint(): string {
    return this.isStockIn ? 'Units being added to stock' : 'Units being removed from stock';
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      productId: [null, Validators.required],
      entryType: ['opening_stock', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.0001)]],
      unitCost: [null],
      referenceNo: [''],
      note: [''],
    });
  }

  ngOnInit() {
    // Load all products (stock entry is valid for any product)
    this.productService.getAllProducts().subscribe({
      next: (all: Product[]) => {
        this.products = all;
      },
      error: () => {
        this.snackBar.open('Failed to load products', 'Close', { duration: 4000 });
      },
    });

    // Pre-select product if passed via query param
    const productId = this.route.snapshot.queryParamMap.get('productId');
    if (productId) {
      this.form.patchValue({ productId: +productId });
    }
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting = true;
    const v = this.form.value;

    // For "out" types, send as negative quantity to the BE
    const isOut = ['adjustment_out', 'sale_out'].includes(v.entryType);
    const qty = isOut ? -Math.abs(v.quantity) : Math.abs(v.quantity);

    this.inventoryService.createEntry({
      productId: v.productId,
      entryType: v.entryType,
      quantity: qty,
      ...(v.unitCost != null && v.unitCost !== '' && { unitCost: +v.unitCost }),
      ...(v.referenceNo && { referenceNo: v.referenceNo }),
      ...(v.note && { note: v.note }),
    }).subscribe({
      next: () => {
        this.snackBar.open('Stock entry saved', 'Close', { duration: 2000 });
        this.router.navigate(['/inventory']);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Failed to save entry', 'Close', { duration: 4000 });
        this.submitting = false;
      },
    });
  }
}
