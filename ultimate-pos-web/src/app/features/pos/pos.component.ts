import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PosService } from '../../core/services/pos.service';
import { ContactService } from '../../core/services/contact.service';
import { ContactListItem } from '../../core/models/contact.model';
import { environment } from '../../../environments/environment';

const POS_PRODUCTS_CACHE_KEY = 'pos_products_cache';
const POS_CART_CACHE_KEY = 'pos_cart_cache';


interface PosProduct {
  id: number;
  name: string;
  sku: string;
  currentStock: number;
  unit?: { shortName: string };
  category?: { name: string };
}

interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div class="pos-layout">
      <!-- Offline banner -->
      @if (isOffline) {
        <div class="offline-banner">
          <mat-icon>wifi_off</mat-icon>
          <span>You are offline. Showing cached products. New sales will be queued.</span>
          <button mat-button (click)="retryOnline()">Retry</button>
        </div>
      }

      <!-- Left: Product Picker -->
      <div class="product-panel">
        <div class="panel-header">
          <h2>Products</h2>
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput #searchInput [formControl]="searchCtrl" placeholder="Search by name or SKU… (F1)" />
          </mat-form-field>
          <!-- Barcode Scanner Row -->
          <div class="barcode-row" [class.scanner-active]="scannerFocused">
            <mat-icon class="barcode-icon">qr_code_scanner</mat-icon>
            <input
              #barcodeInput
              class="barcode-input"
              type="text"
              [formControl]="barcodeCtrl"
              placeholder="Scan barcode / enter SKU → Enter (F3)"
              (keydown.enter)="onBarcodeEnter()"
              (focus)="scannerFocused = true"
              (blur)="scannerFocused = false"
              autocomplete="off"
            />
            <mat-icon *ngIf="scannerFocused" class="scan-ready-icon" matTooltip="Scanner ready">lens</mat-icon>
          </div>
        </div>

        <div *ngIf="searching" class="loading-inline"><mat-spinner diameter="30"></mat-spinner></div>

        <div class="product-grid">
          <div *ngFor="let p of products" class="product-tile"
               [class.out-of-stock]="p.currentStock <= 0"
               (click)="addToCart(p)">
            <div class="product-name">{{ p.name }}</div>
            <div class="product-sku">{{ p.sku }}</div>
            <div class="product-stock" [class.low]="p.currentStock > 0 && p.currentStock <= 5">
              Stock: {{ p.currentStock }} {{ p.unit?.shortName ?? '' }}
            </div>
          </div>
          <div *ngIf="products.length === 0 && !searching" class="no-products">
            No products found. Type to search.
          </div>
        </div>
      </div>

      <!-- Right: Cart -->
      <div class="cart-panel">
        <div class="cart-header">
          <h2>Cart <span class="cart-count" *ngIf="cart.length > 0">({{ cart.length }})</span></h2>
          <button mat-icon-button color="warn" (click)="clearCart()" [disabled]="cart.length === 0"
                  title="Clear cart">
            <mat-icon>delete_sweep</mat-icon>
          </button>
        </div>

        <!-- Customer -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Customer (optional)</mat-label>
          <mat-select [formControl]="customerCtrl">
            <mat-option [value]="null">Walk-in</mat-option>
            <mat-option *ngFor="let c of customers" [value]="c.id">{{ c.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Cart Items -->
        <div class="cart-items">
          <div *ngIf="cart.length === 0" class="empty-cart">
            <mat-icon>shopping_cart</mat-icon>
            <p>Cart is empty. Click a product to add it.</p>
          </div>

          <div *ngFor="let item of cart; let i = index" class="cart-item">
            <div class="item-info">
              <strong>{{ item.productName }}</strong>
              <span class="item-sku">{{ item.sku }}</span>
            </div>
            <div class="item-controls">
              <button mat-icon-button (click)="decQty(i)"><mat-icon>remove</mat-icon></button>
              <span class="qty">{{ item.quantity }}</span>
              <button mat-icon-button (click)="incQty(i)"><mat-icon>add</mat-icon></button>
            </div>
            <div class="item-price">
              <input class="price-input" type="number" min="0" [(ngModel)]="item.unitPrice"
                     (ngModelChange)="recalcItem(i)" />
            </div>
            <div class="item-total">{{ item.lineTotal | number:'1.2-2' }}</div>
            <button mat-icon-button color="warn" (click)="removeItem(i)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Totals -->
        <div class="cart-totals" *ngIf="cart.length > 0">
          <div class="total-row"><span>Subtotal</span><span>{{ subtotal | number:'1.2-2' }}</span></div>

          <div class="total-row">
            <span>Discount</span>
            <div class="discount-input-row">
              <mat-select [formControl]="discTypeCtrl" class="disc-type">
                <mat-option value="fixed">$</mat-option>
                <mat-option value="percentage">%</mat-option>
              </mat-select>
              <input type="number" min="0" [formControl]="discAmountCtrl" class="disc-input" />
            </div>
          </div>
          <div class="total-row"><span>Tax</span>
            <input type="number" min="0" [formControl]="taxCtrl" class="disc-input" />
          </div>
          <div class="total-row grand"><span>Total</span><strong>{{ grandTotal | number:'1.2-2' }}</strong></div>
          <div class="total-row">
            <span>Amount Paid</span>
            <input type="number" min="0" [formControl]="paidCtrl" class="disc-input bold-input" />
          </div>
          <div class="total-row change" *ngIf="change >= 0">
            <span>Change</span><strong class="green">{{ change | number:'1.2-2' }}</strong>
          </div>
        </div>

        <!-- Checkout button -->
        <button mat-raised-button color="primary" class="checkout-btn"
                [disabled]="cart.length === 0 || processing"
                (click)="checkout()">
          <mat-icon>point_of_sale</mat-icon>
          {{ processing ? 'Processing...' : 'Complete Sale — ' + (grandTotal | number:'1.2-2') }}
        </button>

        <!-- Print receipt button (shows after a successful sale) -->
        <button *ngIf="lastSaleId" mat-stroked-button color="accent" class="print-receipt-btn"
                (click)="printReceipt()" matTooltip="Open printable receipt in new tab">
          <mat-icon>print</mat-icon> Print Last Receipt
        </button>

        <!-- Recent Transactions link -->
        <div class="recent-link">
          <a routerLink="/sales">View all sales →</a>
          <span class="kbd-hints">F1 Search · F2 Checkout · F3 Scan Barcode · Esc Clear</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offline-banner { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #fff3e0; color: #e65100; border-bottom: 1px solid #ffcc80; font-size: 0.875rem; }
    .offline-banner mat-icon { color: #e65100; }
    .offline-banner span { flex: 1; }
    .pos-layout { display: flex; height: calc(100vh - 64px); overflow: hidden; }

    /* Left panel */
    .product-panel { flex: 1; display: flex; flex-direction: column; padding: 16px; overflow-y: auto; border-right: 1px solid #e0e0e0; }
    .panel-header { margin-bottom: 12px; }
    .panel-header h2 { margin: 0 0 8px; }
    .search-field { width: 100%; }

    .barcode-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 6px; background: #fff; transition: border-color 0.2s, box-shadow 0.2s; margin-top: 6px; }
    .barcode-row.scanner-active { border-color: #1976d2; box-shadow: 0 0 0 2px rgba(25,118,210,0.18); background: #e3f2fd; }
    .barcode-icon { color: #666; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .barcode-input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.85rem; padding: 4px 0; min-width: 0; }
    .scan-ready-icon { color: #43a047; font-size: 12px; width: 12px; height: 12px; flex-shrink: 0; }
    .loading-inline { display: flex; justify-content: center; padding: 12px; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
    .product-tile { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.15s; }
    .product-tile:hover { border-color: #1976d2; background: #e3f2fd; }
    .product-tile.out-of-stock { opacity: 0.5; cursor: not-allowed; }
    .product-name { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
    .product-sku { color: #888; font-size: 0.75rem; }
    .product-stock { font-size: 0.8rem; margin-top: 6px; color: #388e3c; }
    .product-stock.low { color: #f57c00; }
    .no-products { color: #999; text-align: center; padding: 32px; grid-column: 1/-1; }

    /* Right panel */
    .cart-panel { width: 380px; min-width: 320px; display: flex; flex-direction: column; padding: 16px; background: #fafafa; }
    .cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .cart-header h2 { margin: 0; }
    .cart-count { color: #1976d2; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .cart-items { flex: 1; overflow-y: auto; min-height: 0; }
    .empty-cart { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 16px; color: #999; }
    .empty-cart mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .cart-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #eee; }
    .item-info { flex: 1; min-width: 0; }
    .item-info strong { display: block; font-size: 0.85rem; }
    .item-sku { font-size: 0.75rem; color: #888; }
    .item-controls { display: flex; align-items: center; gap: 2px; }
    .qty { min-width: 24px; text-align: center; font-weight: 600; }
    .price-input { width: 64px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.85rem; }
    .item-total { min-width: 56px; text-align: right; font-size: 0.85rem; font-weight: 500; }
    .cart-totals { padding: 12px 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 0.9rem; }
    .total-row.grand { font-size: 1.1rem; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 6px; }
    .total-row.change { color: #388e3c; }
    .green { color: #388e3c; }
    .discount-input-row { display: flex; align-items: center; gap: 4px; }
    .disc-type { width: 48px; font-size: 0.8rem; }
    .disc-input { width: 72px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.85rem; }
    .bold-input { font-weight: 600; }
    .checkout-btn { width: 100%; height: 48px; margin-top: 16px; font-size: 1rem; }
    .print-receipt-btn { width: 100%; height: 40px; margin-top: 8px; font-size: 0.875rem; }
    .recent-link { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
    .recent-link a { color: #1976d2; text-decoration: none; font-size: 0.85rem; }
    .kbd-hints { font-size: 0.7rem; color: #9e9e9e; font-style: italic; }
  `],
})
export class PosComponent implements OnInit, OnDestroy {
  products: PosProduct[] = [];
  cart: CartItem[] = [];
  customers: ContactListItem[] = [];
  searching = false;
  processing = false;
  isOffline = false;

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('barcodeInput') barcodeInputRef!: ElementRef<HTMLInputElement>;

  searchCtrl = new FormControl('');
  barcodeCtrl = new FormControl('');
  customerCtrl = new FormControl<number | null>(null);
  discTypeCtrl = new FormControl('fixed');
  discAmountCtrl = new FormControl(0);
  taxCtrl = new FormControl(0);
  paidCtrl = new FormControl(0);

  subtotal = 0;
  grandTotal = 0;
  change = 0;
  scannerFocused = false;
  lastSaleId: number | null = null;

  private destroy$ = new Subject<void>();

  /** Reconnect — try fetching products again and clear offline state. */
  @HostListener('window:online')
  onBrowserOnline() {
    this.isOffline = false;
    this.loadProducts(this.searchCtrl.value ?? '');
  }

  /** Mark offline when the browser loses network. */
  @HostListener('window:offline')
  onBrowserOffline() {
    this.isOffline = true;
  }

  /** Keyboard shortcuts: F1 = focus search, F2 = checkout, Esc = clear cart */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Ignore when user is typing inside an input/textarea (except F-keys)
    const tag = (event.target as HTMLElement).tagName.toLowerCase();
    const inInput = tag === 'input' || tag === 'textarea' || tag === 'select';

    if (event.key === 'F1') {
      event.preventDefault();
      this.searchInputRef?.nativeElement?.focus();
    } else if (event.key === 'F3') {
      event.preventDefault();
      this.barcodeInputRef?.nativeElement?.focus();
    } else if (event.key === 'F2') {
      event.preventDefault();
      if (!this.processing && this.cart.length > 0) this.checkout();
    } else if (event.key === 'Escape' && !inInput) {
      if (this.cart.length > 0) this.clearCart();
    }
  }

  constructor(
    private posService: PosService,
    private contactService: ContactService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    // Restore cart from localStorage (survives page refresh)
    try {
      const saved = localStorage.getItem(POS_CART_CACHE_KEY);
      if (saved) {
        this.cart = JSON.parse(saved) as CartItem[];
        this.recalcTotals();
      }
    } catch { /* ignore corrupt data */ }

    // Check connectivity on init
    this.isOffline = !navigator.onLine;

    // Load initial product list
    this.loadProducts('');

    // Debounced search
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$),
    ).subscribe((q) => this.loadProducts(q ?? ''));

    // Recalc on discount/tax changes
    this.discAmountCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.recalcTotals());
    this.discTypeCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.recalcTotals());
    this.taxCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.recalcTotals());
    this.paidCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.recalcTotals());

    // Load customers
    this.contactService.getAll({ type: 'customer' }).subscribe({
      next: (cs) => (this.customers = cs),
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  loadProducts(q: string) {
    this.searching = true;
    this.posService.searchProducts(q || undefined).subscribe({
      next: (ps) => {
        this.products = ps as unknown as PosProduct[];
        this.searching = false;
        this.isOffline = false;
        // Cache the full unfiltered product list for offline use
        if (!q) {
          try { localStorage.setItem(POS_PRODUCTS_CACHE_KEY, JSON.stringify(this.products)); } catch { /* storage full */ }
        }
      },
      error: () => {
        this.searching = false;
        this.isOffline = true;
        // Load from cache
        try {
          const cached = localStorage.getItem(POS_PRODUCTS_CACHE_KEY);
          if (cached) {
            const all: PosProduct[] = JSON.parse(cached);
            this.products = q
              ? all.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
              : all;
          }
        } catch { /* ignore */ }
      },
    });
  }

  /** Manually retry the API connection from the offline banner. */
  retryOnline() {
    this.loadProducts(this.searchCtrl.value ?? '');
  }

  /** Called when user presses Enter in the barcode input (hardware or manual). */
  onBarcodeEnter() {
    const barcode = (this.barcodeCtrl.value ?? '').trim();
    if (!barcode) return;

    this.posService.lookupBySku(barcode).subscribe({
      next: (product) => {
        if (!product) {
          this.snackBar.open(`Barcode "${barcode}" not found`, 'Dismiss', { duration: 2500, panelClass: ['error-snackbar'] });
        } else {
          this.addToCart(product as unknown as PosProduct);
          this.snackBar.open(`✔ ${product.name} added`, '', { duration: 1200, panelClass: ['success-snackbar'] });
        }
        this.barcodeCtrl.setValue('');
        this.barcodeInputRef?.nativeElement?.focus();
      },
      error: () => {
        this.snackBar.open('Scan failed. Please try again.', 'Dismiss', { duration: 2500 });
        this.barcodeCtrl.setValue('');
      },
    });
  }

  addToCart(p: PosProduct) {
    if (p.currentStock <= 0) { this.snackBar.open('Out of stock!', 'Dismiss', { duration: 2000 }); return; }
    const existing = this.cart.find((c) => c.productId === p.id);
    if (existing) {
      existing.quantity++;
      this.recalcItem(this.cart.indexOf(existing));
    } else {
      this.cart.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantity: 1,
        unitPrice: 0,
        discountAmount: 0,
        lineTotal: 0,
      });
    }
    this.recalcTotals();
  }

  removeItem(i: number) { this.cart.splice(i, 1); this.recalcTotals(); }
  clearCart() { this.cart = []; this.recalcTotals(); localStorage.removeItem(POS_CART_CACHE_KEY); }

  incQty(i: number) { this.cart[i].quantity++; this.recalcItem(i); }
  decQty(i: number) {
    if (this.cart[i].quantity <= 1) { this.removeItem(i); return; }
    this.cart[i].quantity--;
    this.recalcItem(i);
  }

  recalcItem(i: number) {
    const item = this.cart[i];
    item.lineTotal = item.quantity * item.unitPrice - item.discountAmount;
    this.recalcTotals();
  }

  recalcTotals() {
    this.subtotal = this.cart.reduce((acc, item) => acc + item.lineTotal, 0);
    const disc = +this.discAmountCtrl.value! || 0;
    const discType = this.discTypeCtrl.value!;
    const discCalc = discType === 'percentage' ? (this.subtotal * disc / 100) : disc;
    const tax = +this.taxCtrl.value! || 0;
    this.grandTotal = Math.max(0, this.subtotal - discCalc + tax);
    const paid = +this.paidCtrl.value! || 0;
    this.change = paid - this.grandTotal;
    // Persist cart
    try { localStorage.setItem(POS_CART_CACHE_KEY, JSON.stringify(this.cart)); } catch { /* storage full */ }
  }

  checkout() {
    if (this.cart.length === 0) return;
    this.processing = true;

    const disc = +this.discAmountCtrl.value! || 0;
    const discType = this.discTypeCtrl.value as 'fixed' | 'percentage';
    const discCalc = discType === 'percentage' ? +(this.subtotal * disc / 100).toFixed(4) : disc;

    const dto = {
      contactId: this.customerCtrl.value ?? undefined,
      status: 'final' as const,
      discountType: discType,
      discountAmount: discCalc,
      taxAmount: +this.taxCtrl.value! || 0,
      shippingAmount: 0,
      paidAmount: +this.paidCtrl.value! || this.grandTotal,
      lines: this.cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxAmount: 0,
      })),
    };

    this.posService.processTransaction(dto).subscribe({
      next: (sale: any) => {
        this.lastSaleId = sale.id;
        this.snackBar.open(`Sale ${sale.invoiceNo} completed!`, 'Print', { duration: 5000 })
          .onAction().subscribe(() => this.printReceipt());
        // Open cash drawer (fire-and-forget — silently skipped if not configured)
        this.posService.openCashDrawer();
        this.clearCart();
        localStorage.removeItem(POS_CART_CACHE_KEY);
        this.paidCtrl.setValue(0);
        this.discAmountCtrl.setValue(0);
        this.taxCtrl.setValue(0);
        this.processing = false;
        // Reload products to reflect updated stock
        this.loadProducts(this.searchCtrl.value ?? '');
      },
      error: () => {
        this.snackBar.open('Transaction failed. Please try again.', 'Dismiss', { duration: 4000 });
        this.processing = false;
      },
    });
  }

  printReceipt() {
    if (!this.lastSaleId) return;
    window.open(`${environment.apiUrl}/documents/receipt/${this.lastSaleId}`, '_blank');
  }
}

