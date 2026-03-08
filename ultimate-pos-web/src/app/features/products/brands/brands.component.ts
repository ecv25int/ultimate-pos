import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../../core/services/product.service';
import { Brand, CreateBrandDto } from '../../../core/models/product.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-brands',
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
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/products">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Brands</h1>
            <p class="subtitle">Manage product brands</p>
          </div>
        </div>
      </div>

      <div class="two-column-layout">
        <!-- Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>branding_watermark</mat-icon>
            <mat-card-title>{{ editingBrand ? 'Edit Brand' : 'Add Brand' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="brandForm" (ngSubmit)="saveBrand()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Brand Name *</mat-label>
                <input matInput formControlName="name" placeholder="e.g. Coca-Cola" />
                <mat-error *ngIf="brandForm.get('name')?.invalid && brandForm.get('name')?.touched">
                  Brand name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3" placeholder="Optional description"></textarea>
              </mat-form-field>

              <div class="form-actions">
                @if (editingBrand) {
                  <button type="button" mat-button (click)="cancelEdit()">Cancel</button>
                }
                <button
                  type="submit"
                  mat-raised-button
                  color="primary"
                  [disabled]="isSubmitting || brandForm.invalid"
                >
                  @if (isSubmitting) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <mat-icon>{{ editingBrand ? 'save' : 'add' }}</mat-icon>
                  }
                  {{ editingBrand ? 'Save' : 'Add Brand' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>All Brands ({{ brands.length }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (isLoading) {
              <div class="loading">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (brands.length === 0) {
              <div class="empty-state">
                <mat-icon>branding_watermark</mat-icon>
                <p>No brands yet. Add your first brand.</p>
              </div>
            } @else {
              <div class="brand-list">
                @for (brand of brands; track brand.id) {
                  <div class="brand-item">
                    <div class="item-content">
                      <div class="brand-avatar">{{ brand.name.charAt(0).toUpperCase() }}</div>
                      <div class="item-info">
                        <span class="item-name">{{ brand.name }}</span>
                        @if (brand.description) {
                          <span class="item-description">{{ brand.description }}</span>
                        }
                      </div>
                    </div>
                    <div class="item-actions">
                      <button mat-icon-button (click)="editBrand(brand)" matTooltip="Edit">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="deleteBrand(brand)" matTooltip="Delete">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
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
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .two-column-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 1.5rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .form-card, .list-card {
      border-radius: 12px;
      height: fit-content;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .loading, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: #9e9e9e;
      gap: 0.5rem;

      mat-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
      }
    }

    .brand-list {
      display: flex;
      flex-direction: column;
    }

    .brand-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #f0f0f0;
      border-radius: 8px;

      &:hover {
        background: #f8f9fa;
      }
    }

    .item-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-weight: 500;
    }

    .item-description {
      font-size: 0.8rem;
      color: #666;
    }

    .item-actions {
      display: flex;
      gap: 0.25rem;
    }
  `],
})
export class BrandsComponent implements OnInit {
  private productService = inject(ProductService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  brands: Brand[] = [];
  isLoading = true;
  isSubmitting = false;
  editingBrand: Brand | null = null;

  brandForm: FormGroup;

  constructor() {
    this.brandForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading = true;
    this.productService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load brands', 'Close', { duration: 3000 });
      },
    });
  }

  editBrand(brand: Brand): void {
    this.editingBrand = brand;
    this.brandForm.patchValue({
      name: brand.name,
      description: brand.description || '',
    });
  }

  cancelEdit(): void {
    this.editingBrand = null;
    this.brandForm.reset({ name: '', description: '' });
  }

  saveBrand(): void {
    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.brandForm.value;
    const data: CreateBrandDto = {
      name: value.name,
      description: value.description || undefined,
    };

    const request = this.editingBrand
      ? this.productService.updateBrand(this.editingBrand.id, data)
      : this.productService.createBrand(data);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        const msg = this.editingBrand ? 'Brand updated' : 'Brand created';
        this.snackBar.open(msg, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.cancelEdit();
        this.loadBrands();
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Failed to save brand';
        this.snackBar.open(msg, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  deleteBrand(brand: Brand): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Brand', message: `Delete brand "${brand.name}"?` },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.productService.deleteBrand(brand.id).subscribe({
        next: () => {
          this.snackBar.open('Brand deleted', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.loadBrands();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to delete brand';
          this.snackBar.open(msg, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    });
  }
}
