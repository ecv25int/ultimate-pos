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
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService } from '../../../core/services/product.service';
import { Category, CreateCategoryDto } from '../../../core/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-categories',
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
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
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
            <h1>Categories</h1>
            <p class="subtitle">Manage product categories and subcategories</p>
          </div>
        </div>
      </div>

      <div class="two-column-layout">
        <!-- Add/Edit Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>category</mat-icon>
            <mat-card-title>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Category Name *</mat-label>
                <input matInput formControlName="name" placeholder="e.g. Beverages" />
                <mat-error *ngIf="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched">
                  Name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Short Code</mat-label>
                <input matInput formControlName="shortCode" placeholder="e.g. BEV" />
                <mat-hint>Optional short identifier</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Parent Category (for sub-category)</mat-label>
                <mat-select formControlName="parentId">
                  <mat-option [value]="null">-- Top Level Category --</mat-option>
                  @for (cat of topLevelCategories; track cat.id) {
                    <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                @if (editingCategory) {
                  <button type="button" mat-button (click)="cancelEdit()">Cancel</button>
                }
                <button
                  type="submit"
                  mat-raised-button
                  color="primary"
                  [disabled]="isSubmitting || categoryForm.invalid"
                >
                  @if (isSubmitting) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <mat-icon>{{ editingCategory ? 'save' : 'add' }}</mat-icon>
                  }
                  {{ editingCategory ? 'Save' : 'Add Category' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Categories List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>All Categories ({{ categories.length }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (isLoading) {
              <div class="loading">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (categories.length === 0) {
              <div class="empty-state">
                <mat-icon>category</mat-icon>
                <p>No categories yet. Add your first category.</p>
              </div>
            } @else {
              <div class="category-tree">
                @for (cat of topLevelCategories; track cat.id) {
                  <div class="category-item parent-item">
                    <div class="item-content">
                      <mat-icon class="cat-icon">folder</mat-icon>
                      <div class="item-info">
                        <span class="item-name">{{ cat.name }}</span>
                        @if (cat.shortCode) {
                          <mat-chip class="code-chip">{{ cat.shortCode }}</mat-chip>
                        }
                      </div>
                    </div>
                    <div class="item-actions">
                      <button mat-icon-button (click)="editCategory(cat)" matTooltip="Edit">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="deleteCategory(cat)" matTooltip="Delete">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>

                  @for (sub of getSubcategories(cat.id); track sub.id) {
                    <div class="category-item sub-item">
                      <div class="item-content">
                        <mat-icon class="cat-icon sub-icon">subdirectory_arrow_right</mat-icon>
                        <div class="item-info">
                          <span class="item-name">{{ sub.name }}</span>
                          @if (sub.shortCode) {
                            <mat-chip class="code-chip">{{ sub.shortCode }}</mat-chip>
                          }
                        </div>
                      </div>
                      <div class="item-actions">
                        <button mat-icon-button (click)="editCategory(sub)" matTooltip="Edit">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteCategory(sub)" matTooltip="Delete">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                }

                <!-- Orphaned categories without parent -->
                @for (cat of orphanedCategories; track cat.id) {
                  <div class="category-item parent-item">
                    <div class="item-content">
                      <mat-icon class="cat-icon">folder</mat-icon>
                      <div class="item-info">
                        <span class="item-name">{{ cat.name }}</span>
                        @if (cat.shortCode) {
                          <mat-chip class="code-chip">{{ cat.shortCode }}</mat-chip>
                        }
                      </div>
                    </div>
                    <div class="item-actions">
                      <button mat-icon-button (click)="editCategory(cat)" matTooltip="Edit">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="deleteCategory(cat)" matTooltip="Delete">
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
      max-width: 1200px;
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
      margin-top: 0.5rem;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: #9e9e9e;
      gap: 0.5rem;

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
      }
    }

    .category-tree {
      display: flex;
      flex-direction: column;
    }

    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 2px;

      &:hover {
        background: #f8f9fa;
      }

      &.parent-item {
        background: transparent;
      }

      &.sub-item {
        padding-left: 2rem;
        background: #fafafa;
      }
    }

    .item-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cat-icon {
      color: #9e9e9e;
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;

      &.sub-icon {
        color: #bdbdbd;
      }
    }

    .item-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .item-name {
      font-weight: 500;
      font-size: 0.95rem;
    }

    .code-chip {
      font-size: 0.7rem;
      height: 20px;
      background: #e3f2fd;
      color: #1976d2;
    }

    .item-actions {
      display: flex;
      gap: 0.25rem;
    }
  `],
})
export class CategoriesComponent implements OnInit {
  private productService = inject(ProductService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  categories: Category[] = [];
  topLevelCategories: Category[] = [];
  orphanedCategories: Category[] = [];
  isLoading = true;
  isSubmitting = false;
  editingCategory: Category | null = null;

  categoryForm: FormGroup;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      shortCode: [''],
      parentId: [null],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.productService.getAllCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.topLevelCategories = cats.filter((c) => !c.parentId);
        const assignedSubIds = new Set(cats.filter(c => c.parentId).map(c => c.id));
        this.orphanedCategories = []; // cleared in this simple model
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      },
    });
  }

  getSubcategories(parentId: number): Category[] {
    return this.categories.filter((c) => c.parentId === parentId);
  }

  editCategory(cat: Category): void {
    this.editingCategory = cat;
    this.categoryForm.patchValue({
      name: cat.name,
      shortCode: cat.shortCode || '',
      parentId: cat.parentId || null,
    });
  }

  cancelEdit(): void {
    this.editingCategory = null;
    this.categoryForm.reset({ name: '', shortCode: '', parentId: null });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.categoryForm.value;
    const data: CreateCategoryDto = {
      name: value.name,
      shortCode: value.shortCode || undefined,
      parentId: value.parentId || undefined,
    };

    const request = this.editingCategory
      ? this.productService.updateCategory(this.editingCategory.id, data)
      : this.productService.createCategory(data);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        const msg = this.editingCategory ? 'Category updated' : 'Category created';
        this.snackBar.open(msg, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.cancelEdit();
        this.loadCategories();
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Failed to save category';
        this.snackBar.open(msg, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  deleteCategory(cat: Category): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Category', message: `Delete category "${cat.name}"?` },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.productService.deleteCategory(cat.id).subscribe({
        next: () => {
          this.snackBar.open('Category deleted', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.loadCategories();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to delete category';
          this.snackBar.open(msg, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    });
  }
}
