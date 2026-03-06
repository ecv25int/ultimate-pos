import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { BarcodeService } from '../../../core/services/barcode.service';
import { Product } from '../../../core/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatBadgeModule,
    MatDialogModule,
    MatSelectModule,
    MatExpansionModule,
    SkeletonLoaderComponent,
  ],
  template: `
    <div class="products-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">inventory_2</mat-icon>
          <div>
            <h1>Products</h1>
            <p class="subtitle">Manage your product catalog</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="/products/create">
            <mat-icon>add</mat-icon>
            Add Product
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon blue">inventory_2</mat-icon>
              <div>
                <div class="stat-number">{{ products.length }}</div>
                <div class="stat-label">Total Products</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon green">check_circle</mat-icon>
              <div>
                <div class="stat-number">{{ stockEnabledCount }}</div>
                <div class="stat-label">Stock Tracked</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon orange">warning</mat-icon>
              <div>
                <div class="stat-number">{{ lowStockCount }}</div>
                <div class="stat-label">Low Stock Alerts</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon purple">category</mat-icon>
              <div>
                <div class="stat-number">{{ variableProductCount }}</div>
                <div class="stat-label">Variable Products</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Search & Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search products...</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input
                matInput
                [(ngModel)]="searchQuery"
                (input)="applyFilter()"
                placeholder="Name, SKU..."
              />
              @if (searchQuery) {
                <button matSuffix mat-icon-button (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <div class="filter-chips">
              <span class="filter-label">Filter:</span>
              <mat-chip-listbox [(ngModel)]="typeFilter" (change)="setTypeFilter($event.value)">
                <mat-chip-option value="all">All</mat-chip-option>
                <mat-chip-option value="single">Single</mat-chip-option>
                <mat-chip-option value="variable">Variable</mat-chip-option>
              </mat-chip-listbox>
            </div>

            <div class="quick-links">
              <button mat-stroked-button routerLink="/products/categories">
                <mat-icon>category</mat-icon>
                Categories
              </button>
              <button mat-stroked-button routerLink="/products/brands">
                <mat-icon>branding_watermark</mat-icon>
                Brands
              </button>
              <button mat-stroked-button routerLink="/products/units">
                <mat-icon>straighten</mat-icon>
                Units
              </button>
            </div>
          </div>

          <!-- Advanced Filters (collapsible) -->
          <mat-expansion-panel [(expanded)]="showAdvancedFilters" [hideToggle]="false" class="adv-panel">
            <mat-expansion-panel-header>
              <mat-panel-title style="font-size:13px;font-weight:600;color:#4f46e5">
                <mat-icon style="font-size:16px;height:16px;width:16px;margin-right:6px">tune</mat-icon>
                Advanced Filters
                @if (hasAdvancedFilters()) {
                  <span class="adv-badge">Active</span>
                }
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="adv-filter-grid">
              <mat-form-field appearance="outline" class="adv-field">
                <mat-label>Category</mat-label>
                <mat-select [(ngModel)]="advCategoryId">
                  <mat-option [value]="null">All Categories</mat-option>
                  @for (cat of categories; track cat.id) {
                    <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="adv-field">
                <mat-label>Brand</mat-label>
                <mat-select [(ngModel)]="advBrandId">
                  <mat-option [value]="null">All Brands</mat-option>
                  @for (brand of brands; track brand.id) {
                    <mat-option [value]="brand.id">{{ brand.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="adv-field">
                <mat-label>Stock Status</mat-label>
                <mat-select [(ngModel)]="advStockStatus">
                  <mat-option value="">All</mat-option>
                  <mat-option value="in_stock">In Stock</mat-option>
                  <mat-option value="low_stock">Low Stock</mat-option>
                  <mat-option value="out_of_stock">Out of Stock</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="adv-actions">
                <button mat-raised-button color="primary" (click)="applyAdvancedSearch()">
                  <mat-icon>search</mat-icon> Search
                </button>
                <button mat-stroked-button (click)="resetAllFilters()">
                  <mat-icon>clear</mat-icon> Reset
                </button>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      <mat-card class="table-card">
        <mat-card-content>
          @if (isLoading) {
            <app-skeleton-loader [rows]="8" type="table"></app-skeleton-loader>
          } @else if (filteredProducts.length === 0) {
            <div class="empty-state">
              <mat-icon class="empty-icon">inventory_2</mat-icon>
              @if (searchQuery || typeFilter !== 'all') {
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
                <button mat-button (click)="resetFilters()">Clear Filters</button>
              } @else {
                <h3>No products yet</h3>
                <p>Add your first product to get started</p>
                <button mat-raised-button color="primary" routerLink="/products/create">
                  <mat-icon>add</mat-icon>
                  Add First Product
                </button>
              }
            </div>
          } @else {
            <table mat-table [dataSource]="paginatedProducts" class="products-table">
              <!-- SKU Column -->
              <ng-container matColumnDef="sku">
                <th mat-header-cell *matHeaderCellDef>SKU</th>
                <td mat-cell *matCellDef="let product">
                  <span class="sku-badge">{{ product.sku }}</span>
                </td>
              </ng-container>

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Product Name</th>
                <td mat-cell *matCellDef="let product">
                  <div class="product-name-cell">
                    <mat-icon class="product-icon">{{ product.type === 'variable' ? 'workspaces' : 'inventory_2' }}</mat-icon>
                    <div>
                      <div class="product-name">{{ product.name }}</div>
                      @if (product.category) {
                        <div class="product-category">{{ product.category.name }}</div>
                      }
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let product">
                  <mat-chip [class]="'type-chip ' + product.type">
                    {{ product.type | titlecase }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Unit Column -->
              <ng-container matColumnDef="unit">
                <th mat-header-cell *matHeaderCellDef>Unit</th>
                <td mat-cell *matCellDef="let product">
                  {{ product.unit?.shortName || '-' }}
                </td>
              </ng-container>

              <!-- Brand Column -->
              <ng-container matColumnDef="brand">
                <th mat-header-cell *matHeaderCellDef>Brand</th>
                <td mat-cell *matCellDef="let product">
                  {{ product.brand?.name || '-' }}
                </td>
              </ng-container>

              <!-- Stock Column -->
              <ng-container matColumnDef="stock">
                <th mat-header-cell *matHeaderCellDef>Stock Tracking</th>
                <td mat-cell *matCellDef="let product">
                  @if (product.enableStock) {
                    <mat-chip class="stock-chip enabled">
                      <mat-icon class="chip-icon">check</mat-icon>
                      Enabled
                    </mat-chip>
                  } @else {
                    <mat-chip class="stock-chip disabled">Disabled</mat-chip>
                  }
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let product">
                  <div class="action-buttons">
                    <button
                      mat-icon-button
                      color="primary"
                      [routerLink]="['/products/edit', product.id]"
                      matTooltip="Edit product"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="accent"
                      (click)="downloadBarcode(product)"
                      matTooltip="Download barcode"
                    >
                      <mat-icon>qr_code</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="deleteProduct(product)"
                      matTooltip="Delete product"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="product-row"></tr>
            </table>

            <mat-paginator
              [length]="filteredProducts.length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            ></mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .products-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #1976d2;
    }

    h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      border-radius: 12px;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 10px;
      padding: 0.5rem;
      
      &.blue { color: #1976d2; background: #e3f2fd; }
      &.green { color: #388e3c; background: #e8f5e9; }
      &.orange { color: #f57c00; background: #fff3e0; }
      &.purple { color: #7b1fa2; background: #f3e5f5; }
    }

    .stat-number {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1;
      color: #1a1a1a;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .filter-card {
      margin-bottom: 1rem;
      border-radius: 12px;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .filter-chips {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.85rem;
      color: #666;
      white-space: nowrap;
    }

    .quick-links {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }

    .adv-panel { margin-top: 12px; border: 1px solid #e0e7ff !important; background: #fafafa !important; border-radius: 8px !important; }
    .adv-filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; align-items: center; padding: 4px 0; }
    .adv-field { font-size: 13px; }
    .adv-actions { display: flex; gap: 8px; align-items: center; }
    .adv-badge { background: #e0e7ff; color: #4f46e5; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; margin-left: 8px; }

    .table-card {
      border-radius: 12px;
      overflow: hidden;
    }

    .products-table {
      width: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      gap: 1rem;
      color: #666;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      text-align: center;
      color: #666;
    }

    .empty-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #bdbdbd;
      margin-bottom: 1rem;
    }

    .sku-badge {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 2px 8px;
      font-family: monospace;
      font-size: 0.85rem;
      color: #333;
    }

    .product-name-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .product-icon {
      color: #9e9e9e;
      font-size: 1.25rem;
    }

    .product-name {
      font-weight: 500;
      color: #1a1a1a;
    }

    .product-category {
      font-size: 0.8rem;
      color: #666;
    }

    .type-chip {
      font-size: 0.75rem;
      
      &.single { background: #e3f2fd; color: #1976d2; }
      &.variable { background: #f3e5f5; color: #7b1fa2; }
    }

    .stock-chip {
      font-size: 0.75rem;
      
      &.enabled { background: #e8f5e9; color: #388e3c; }
      &.disabled { background: #f5f5f5; color: #9e9e9e; }
    }

    .chip-icon {
      font-size: 0.9rem !important;
      width: 0.9rem !important;
      height: 0.9rem !important;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .product-row {
      cursor: pointer;
      transition: background-color 0.15s ease;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .quick-links {
        margin-left: 0;
      }
    }
  `],
})
export class ProductsListComponent implements OnInit {
  private productService = inject(ProductService);
  private barcodeService = inject(BarcodeService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  isLoading = true;

  // Stats
  stockEnabledCount = 0;
  lowStockCount = 0;
  variableProductCount = 0;

  // Basic filters
  searchQuery = '';
  typeFilter = 'all';

  // Advanced filters
  showAdvancedFilters = false;
  advCategoryId: number | null = null;
  advBrandId: number | null = null;
  advStockStatus = '';
  categories: { id: number; name: string }[] = [];
  brands: { id: number; name: string }[] = [];

  // Pagination
  pageSize = 25;
  currentPage = 0;

  displayedColumns = ['sku', 'name', 'type', 'unit', 'brand', 'stock', 'actions'];

  ngOnInit(): void {
    this.loadProducts();
    // Pre-load categories + brands for the advanced filter dropdowns
    forkJoin({
      cats: this.productService.getAllCategories(),
      brands: this.productService.getAllBrands(),
    }).subscribe({ next: ({ cats, brands }) => { this.categories = cats; this.brands = brands; } });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.calculateStats();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        const msg = error.error?.message || 'Failed to load products';
        this.snackBar.open(msg, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  calculateStats(): void {
    this.stockEnabledCount = this.products.filter((p) => p.enableStock).length;
    this.lowStockCount = this.products.filter(
      (p) => p.enableStock && p.alertQuantity > 0,
    ).length;
    this.variableProductCount = this.products.filter(
      (p) => p.type === 'variable',
    ).length;
  }

  applyFilter(): void {
    let filtered = [...this.products];

    // Search filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand?.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q),
      );
    }

    // Type filter
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter((p) => p.type === this.typeFilter);
    }

    this.filteredProducts = filtered;
    this.currentPage = 0;
    this.updatePagination();
  }

  setTypeFilter(type: string): void {
    this.typeFilter = type;
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilter();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.typeFilter = 'all';
    this.applyFilter();
  }

  hasAdvancedFilters(): boolean {
    return !!(this.advCategoryId || this.advBrandId || this.advStockStatus);
  }

  applyAdvancedSearch(): void {
    this.isLoading = true;
    this.productService.searchProducts({
      q: this.searchQuery || undefined,
      categoryId: this.advCategoryId ?? undefined,
      brandId: this.advBrandId ?? undefined,
      type: this.typeFilter !== 'all' ? this.typeFilter : undefined,
      stockStatus: this.advStockStatus || undefined,
      limit: 100,
    }).subscribe({
      next: (res) => {
        this.products = res.products;
        this.filteredProducts = res.products;
        this.calculateStats();
        this.currentPage = 0;
        this.updatePagination();
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Search failed. Showing all products.', 'Close', { duration: 4000 });
        this.isLoading = false;
      },
    });
  }

  resetAllFilters(): void {
    this.searchQuery = '';
    this.typeFilter = 'all';
    this.advCategoryId = null;
    this.advBrandId = null;
    this.advStockStatus = '';
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(start, end);
  }

  deleteProduct(product: Product): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Product', message: `Are you sure you want to delete "${product.name}"?` },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.snackBar.open(`"${product.name}" deleted successfully`, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.loadProducts();
        },
        error: (error) => {
          const msg = error.error?.message || 'Failed to delete product';
          this.snackBar.open(msg, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    });
  }

  downloadBarcode(product: Product): void {
    this.barcodeService.getProductBarcodeBlob(product.id).subscribe({
      next: (blob) => {
        this.barcodeService.downloadBarcode(blob, `barcode-${product.sku}.png`);
        this.snackBar.open(`Barcode downloaded for ${product.name}`, 'Dismiss', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('Failed to generate barcode', 'Dismiss', { duration: 3000 });
      },
    });
  }
}
