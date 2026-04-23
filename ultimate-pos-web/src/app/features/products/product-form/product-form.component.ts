import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../../core/services/product.service';
import { Category, Brand, Unit, CreateProductDto } from '../../../core/models/product.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div class="form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/products">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ isEditMode ? ('PRODUCTS.EDIT_PRODUCT' | translate) : ('PRODUCTS.ADD_NEW_PRODUCT' | translate) }}</h1>
            <p class="subtitle">{{ isEditMode ? ('PRODUCTS.UPDATE_PRODUCT_INFO' | translate) : ('PRODUCTS.CREATE_NEW_PRODUCT' | translate) }}</p>
          </div>
        </div>
      </div>

      @if (isLoadingData) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>{{ 'COMMON.LOADING' | translate }}</p>
        </div>
      } @else {
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
          <div class="form-layout">
            <!-- Basic Information -->
            <mat-card class="form-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>info</mat-icon>
                <mat-card-title>{{ 'PRODUCTS.BASIC_INFORMATION' | translate }}</mat-card-title>
                <mat-card-subtitle>{{ 'PRODUCTS.PRODUCT_NAME_SKU_TYPE' | translate }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <!-- Product Name -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ 'PRODUCTS.PRODUCT_NAME' | translate }} *</mat-label>
                  <input matInput formControlName="name" [placeholder]="'PRODUCTS.PRODUCT_NAME_HINT' | translate" />
                  <mat-error *ngIf="name?.invalid && name?.touched">
                    <span *ngIf="name?.errors?.['required']">{{ 'PRODUCTS.PRODUCT_NAME_REQUIRED' | translate }}</span>
                    <span *ngIf="name?.errors?.['maxlength']">{{ 'PRODUCTS.MAX_255_CHARS' | translate }}</span>
                  </mat-error>
                </mat-form-field>

                <!-- SKU -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ 'PRODUCTS.SKU' | translate }} *</mat-label>
                  <input matInput formControlName="sku" [placeholder]="'PRODUCTS.SKU_HINT' | translate" />
                  <mat-hint>{{ 'PRODUCTS.UNIQUE_IDENTIFIER' | translate }}</mat-hint>
                  <mat-error *ngIf="sku?.invalid && sku?.touched">
                    <span *ngIf="sku?.errors?.['required']">{{ 'PRODUCTS.SKU_REQUIRED' | translate }}</span>
                  </mat-error>
                </mat-form-field>

                <!-- Product Type -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ 'PRODUCTS.PRODUCT_TYPE' | translate }}</mat-label>
                  <mat-select formControlName="type">
                    <mat-option value="single">
                      <div class="option-with-icon">
                        <mat-icon>inventory_2</mat-icon>
                        <div>
                          <div>{{ 'PRODUCTS.SINGLE_PRODUCT' | translate }}</div>
                          <div class="option-description">{{ 'PRODUCTS.ONE_SKU_NO_VARIATIONS' | translate }}</div>
                        </div>
                      </div>
                    </mat-option>
                    <mat-option value="variable">
                      <div class="option-with-icon">
                        <mat-icon>workspaces</mat-icon>
                        <div>
                          <div>{{ 'PRODUCTS.VARIABLE_PRODUCT' | translate }}</div>
                          <div class="option-description">{{ 'PRODUCTS.MULTIPLE_VARIATIONS' | translate }}</div>
                        </div>
                      </div>
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Barcode Type -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ 'PRODUCTS.BARCODE_TYPE' | translate }}</mat-label>
                  <mat-select formControlName="barcodeType">
                    <mat-option value="C128">{{ 'PRODUCTS.CODE_128_RECOMMENDED' | translate }}</mat-option>
                    <mat-option value="C39">{{ 'PRODUCTS.CODE_39' | translate }}</mat-option>
                    <mat-option value="EAN-13">{{ 'PRODUCTS.EAN_13_INTERNATIONAL' | translate }}</mat-option>
                    <mat-option value="EAN-8">{{ 'PRODUCTS.EAN_8' | translate }}</mat-option>
                    <mat-option value="UPC-A">{{ 'PRODUCTS.UPC_A_NORTH_AMERICA' | translate }}</mat-option>
                    <mat-option value="UPC-E">{{ 'PRODUCTS.UPC_E' | translate }}</mat-option>
                    <mat-option value="ITF-14">{{ 'PRODUCTS.ITF_14_SHIPPING' | translate }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <!-- Classification -->
            <mat-card class="form-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>category</mat-icon>
                <mat-card-title>{{ 'PRODUCTS.CLASSIFICATION' | translate }}</mat-card-title>
                <mat-card-subtitle>{{ 'PRODUCTS.CATEGORY_BRAND_UNIT' | translate }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <!-- Category -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ 'PRODUCTS.CATEGORY' | translate }}</mat-label>
                  <mat-select formControlName="categoryId">
                    <mat-option [value]="null">-- {{ 'COMMON.NO_CATEGORY' | translate }} --</mat-option>
                    @for (cat of parentCategories; track cat.id) {
                      <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                      @for (sub of cat.subcategories; track sub.id) {
                        <mat-option [value]="sub.id">&nbsp;&nbsp;↳ {{ sub.name }}</mat-option>
                      }
                    }
                  </mat-select>
                  <mat-hint>
                    <a routerLink="/products/categories" class="add-link">{{ 'PRODUCTS.MANAGE_CATEGORIES' | translate }}</a>
                  </mat-hint>
                </mat-form-field>

                <!-- Sub-Category -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ 'PRODUCTS.SUB_CATEGORY' | translate }}</mat-label>
                  <mat-select formControlName="subCategoryId">
                    <mat-option [value]="null">-- {{ 'COMMON.NO_SUB_CATEGORY' | translate }} --</mat-option>
                    @for (cat of categories; track cat.id) {
                      <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>
                    <a routerLink="/products/categories" class="add-link">{{ 'PRODUCTS.MANAGE_CATEGORIES' | translate }}</a>
                  </mat-hint>
                </mat-form-field>

                <!-- Brand -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ 'PRODUCTS.BRAND' | translate }}</mat-label>
                  <mat-select formControlName="brandId">
                    <mat-option [value]="null">-- {{ 'COMMON.NO_BRAND' | translate }} --</mat-option>
                    @for (brand of brands; track brand.id) {
                      <mat-option [value]="brand.id">{{ brand.name }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>
                    <a routerLink="/products/brands" class="add-link">{{ 'PRODUCTS.MANAGE_BRANDS' | translate }}</a>
                  </mat-hint>
                </mat-form-field>

                <!-- Unit -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ 'PRODUCTS.UNIT_MEASUREMENT' | translate }} *</mat-label>
                  <mat-select formControlName="unitId">
                    <mat-option [value]="null">-- {{ 'COMMON.SELECT_UNIT' | translate }} --</mat-option>
                    @for (unit of units; track unit.id) {
                      <mat-option [value]="unit.id">
                        {{ unit.actualName }} ({{ unit.shortName }})
                      </mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="unitId?.invalid && unitId?.touched">
                    {{ 'PRODUCTS.UNIT_REQUIRED' | translate }}
                  </mat-error>
                  <mat-hint>
                    <a routerLink="/products/units" class="add-link">{{ 'PRODUCTS.MANAGE_UNITS' | translate }}</a>
                  </mat-hint>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <!-- Stock Management -->
            <mat-card class="form-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>inventory</mat-icon>
                <mat-card-title>{{ 'PRODUCTS.STOCK_MANAGEMENT' | translate }}</mat-card-title>
                <mat-card-subtitle>{{ 'PRODUCTS.INVENTORY_TRACKING_SETTINGS' | translate }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="checkbox-field">
                  <mat-checkbox formControlName="enableStock" color="primary">
                    {{ 'PRODUCTS.ENABLE_STOCK_TRACKING' | translate }}
                  </mat-checkbox>
                  <p class="field-hint">{{ 'PRODUCTS.STOCK_TRACKING_HINT' | translate }}</p>
                </div>

                @if (productForm.get('enableStock')?.value) {
                  <mat-divider class="my-divider"></mat-divider>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>{{ 'PRODUCTS.ALERT_QUANTITY' | translate }}</mat-label>
                    <input matInput type="number" formControlName="alertQuantity" placeholder="0" min="0" />
                    <mat-hint>{{ 'PRODUCTS.LOW_STOCK_ALERT_HINT' | translate }}</mat-hint>
                    <mat-error *ngIf="alertQuantity?.invalid && alertQuantity?.touched">
                      {{ 'COMMON.INVALID_QUANTITY' | translate }}
                    </mat-error>
                  </mat-form-field>
                }
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Form Actions -->
          <!-- Image Upload -->
          <div class="image-upload-section">
            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>image</mat-icon> {{ 'PRODUCTS.PRODUCT_IMAGE' | translate }}
                </mat-card-title>
                <mat-card-subtitle>{{ 'PRODUCTS.IMAGE_UPLOAD_HINT' | translate }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="img-preview-row">
                  @if (imagePreviewUrl || existingImageUrl) {
                    <div class="img-preview-wrap">
                      <img [src]="imagePreviewUrl || apiBase + existingImageUrl" alt="Product image" class="img-preview" />
                      <button
                        type="button" mat-icon-button color="warn"
                        class="img-remove-btn"
                        (click)="onRemoveImage()"
                        [matTooltip]="'COMMON.REMOVE_IMAGE' | translate"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  } @else {
                    <div class="img-placeholder">
                      <mat-icon>image_not_supported</mat-icon>
                      <span>{{ 'COMMON.NO_IMAGE' | translate }}</span>
                    </div>
                  }

                  <div class="img-upload-controls">
                    <input
                      #imageFileInput
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      style="display:none"
                      (change)="onImageFileSelected($event)"
                    />
                    <button type="button" mat-stroked-button color="primary" (click)="imageFileInput.click()">
                      <mat-icon>upload</mat-icon>
                      {{ (imagePreviewUrl || existingImageUrl ? 'COMMON.CHANGE_IMAGE' : 'COMMON.UPLOAD_IMAGE') | translate }}
                    </button>
                    @if (uploadingImage) {
                      <mat-progress-spinner diameter="20" mode="indeterminate" style="margin-left:8px"></mat-progress-spinner>
                    }
                    @if (selectedImageFile) {
                      <span class="img-filename">{{ selectedImageFile.name }}</span>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" mat-button routerLink="/products">
              {{ 'COMMON.CANCEL' | translate }}
            </button>
            <button
              type="submit"
              mat-raised-button
              color="primary"
              [disabled]="isSubmitting || productForm.invalid"
            >
              @if (isSubmitting) {
                <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
              } @else {
                <mat-icon>{{ isEditMode ? 'save' : 'add' }}</mat-icon>
              }
              {{ (isEditMode ? 'COMMON.SAVE_CHANGES' : 'PRODUCTS.CREATE_PRODUCT') | translate }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-container {
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

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
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

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      gap: 1rem;
      color: #666;
    }

    .form-layout {
      display: grid;
      gap: 1.5rem;
    }

    .form-card {
      border-radius: 12px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    .option-with-icon {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .option-description {
      font-size: 0.8rem;
      color: #666;
    }

    .checkbox-field {
      padding: 0.5rem 0;
    }

    .field-hint {
      margin: 0.5rem 0 0 1.9rem;
      font-size: 0.8rem;
      color: #666;
    }

    .my-divider {
      margin: 1rem 0;
    }

    .add-link {
      color: #1976d2;
      text-decoration: none;
      font-size: 0.8rem;
      
      &:hover {
        text-decoration: underline;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-bottom: 2rem;
    }

    .image-upload-section { margin-top: 1rem; }
    .img-preview-row { display: flex; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap; }
    .img-preview-wrap { position: relative; display: inline-block; }
    .img-preview { max-width: 140px; max-height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid #e0e0e0; display: block; }
    .img-remove-btn { position: absolute; top: -10px; right: -10px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
    .img-placeholder { width: 140px; height: 140px; background: #f5f5f5; border: 1px dashed #ccc; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9e9e9e; gap: 6px; font-size: 0.8rem; }
    .img-placeholder mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .img-upload-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .img-filename { font-size: 0.8rem; color: #555; word-break: break-all; max-width: 220px; }

    .btn-spinner {
      display: inline-block;
      margin-right: 0.5rem;
    }
  `],
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  readonly apiBase = 'http://localhost:3000'; // serve-static host; override via environment

  // Image upload state
  existingImageUrl: string | null = null;
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  uploadingImage = false;

  productForm: FormGroup;
  isEditMode = false;
  productId: number | null = null;
  isLoadingData = true;
  isSubmitting = false;

  categories: Category[] = [];
  parentCategories: Category[] = [];
  brands: Brand[] = [];
  units: Unit[] = [];

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      sku: ['', Validators.required],
      type: ['single'],
      barcodeType: ['C128'],
      categoryId: [null],
      subCategoryId: [null],
      brandId: [null],
      unitId: [null, Validators.required],
      enableStock: [false],
      alertQuantity: [0],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.params['id']
      ? +this.route.snapshot.params['id']
      : null;
    this.isEditMode = !!this.productId;

    // Load dropdowns in parallel
    forkJoin({
      categories: this.productService.getAllCategories(),
      brands: this.productService.getAllBrands(),
      units: this.productService.getAllUnits(),
    }).subscribe({
      next: ({ categories, brands, units }) => {
        this.categories = categories;
        this.brands = brands;
        this.units = units;

        // Build parent categories with subcategories
        this.parentCategories = categories
          .filter((c) => !c.parentId)
          .map((parent) => ({
            ...parent,
            subcategories: categories.filter((c) => c.parentId === parent.id),
          }));

        if (this.isEditMode && this.productId) {
          this.loadProduct(this.productId);
        } else {
          this.isLoadingData = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoadingData = false;
        this.cdr.detectChanges();
        this.snackBar.open('Failed to load form data', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  loadProduct(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          sku: product.sku,
          type: product.type,
          barcodeType: product.barcodeType,
          categoryId: product.categoryId ?? null,
          subCategoryId: product.subCategoryId ?? null,
          brandId: product.brandId ?? null,
          unitId: product.unitId,
          enableStock: product.enableStock,
          alertQuantity: product.alertQuantity,
        });
        this.existingImageUrl = product.imageUrl ?? null;
        this.isLoadingData = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingData = false;
        this.cdr.detectChanges();
        this.snackBar.open('Failed to load product', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
        this.router.navigate(['/products']);
      },
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    const productData: CreateProductDto = {
      name: formValue.name,
      sku: formValue.sku,
      type: formValue.type,
      barcodeType: formValue.barcodeType,
      categoryId: formValue.categoryId || undefined,
      subCategoryId: formValue.subCategoryId || undefined,
      brandId: formValue.brandId || undefined,
      unitId: formValue.unitId,
      enableStock: formValue.enableStock,
      alertQuantity: formValue.alertQuantity || 0,
    };

    const request = this.isEditMode && this.productId
      ? this.productService.updateProduct(this.productId, productData)
      : this.productService.createProduct(productData);

    request.subscribe({
      next: (savedProduct) => {
        this.isSubmitting = false;
        const product = savedProduct as any;
        // Upload image if one was selected
        if (this.selectedImageFile && product?.id) {
          this.uploadingImage = true;
          this.productService.uploadImage(product.id, this.selectedImageFile).subscribe({
            next: (updated) => {
              this.uploadingImage = false;
              this.existingImageUrl = (updated as any).imageUrl ?? null;
              this.selectedImageFile = null;
              this.snackBar.open(this.isEditMode ? 'Product updated' : 'Product created', 'Close', {
                duration: 3000, panelClass: ['success-snackbar'],
              });
              this.router.navigate(['/products']);
            },
            error: () => {
              this.uploadingImage = false;
              // Product saved but image upload failed; navigate anyway
              this.snackBar.open('Product saved but image upload failed', 'Close', {
                duration: 4000, panelClass: ['error-snackbar'],
              });
              this.router.navigate(['/products']);
            },
          });
        } else {
          const msg = this.isEditMode ? 'Product updated successfully' : 'Product created successfully';
          this.snackBar.open(msg, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.router.navigate(['/products']);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        const errMessage = error.error?.message;
        const msg = Array.isArray(errMessage)
          ? errMessage.join(', ')
          : errMessage || 'Failed to save product';
        this.snackBar.open(msg, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  // Getters
  get name() { return this.productForm.get('name'); }
  get sku() { return this.productForm.get('sku'); }
  get unitId() { return this.productForm.get('unitId'); }
  get alertQuantity() { return this.productForm.get('alertQuantity'); }

  /** Handle image file selection — generate a local preview URL. */
  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // Revoke previous preview URL to avoid memory leaks
    if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
    this.selectedImageFile = file;
    this.imagePreviewUrl = URL.createObjectURL(file);
  }

  /** Remove the product image immediately (API call if editing, or just clear selection if new). */
  onRemoveImage() {
    // Clear local preview state
    if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
    this.imagePreviewUrl = null;
    this.selectedImageFile = null;

    if (this.isEditMode && this.productId && this.existingImageUrl) {
      this.productService.removeImage(this.productId).subscribe({
        next: () => {
          this.existingImageUrl = null;
          this.snackBar.open('Image removed', '', { duration: 2000 });
        },
        error: () => this.snackBar.open('Failed to remove image', 'Close', { duration: 3000, panelClass: ['error-snackbar'] }),
      });
    } else {
      this.existingImageUrl = null;
    }
  }
}
