import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpensesService } from '../../core/services/expenses.service';
import {
  Expense,
  ExpenseCategory,
  ExpenseSummary,
} from '../../core/models/expense.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    SkeletonLoaderComponent,
  ],
  template: `
    <div class="expenses-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">receipt_long</mat-icon>
          <div>
            <h1>Expenses</h1>
            <p class="subtitle">Track and manage business expenses</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="create">
            <mat-icon>add</mat-icon>
            New Expense
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon blue">receipt_long</mat-icon>
              <div>
                <div class="stat-number">{{ summary?.total ?? 0 }}</div>
                <div class="stat-label">Total Expenses</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon green">attach_money</mat-icon>
              <div>
                <div class="stat-number">{{ summary?.totalAmount ?? 0 | number:'1.2-2' }}</div>
                <div class="stat-label">Total Amount</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon orange">account_balance</mat-icon>
              <div>
                <div class="stat-number">{{ summary?.totalTax ?? 0 | number:'1.2-2' }}</div>
                <div class="stat-label">Total Tax</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon purple">folder_open</mat-icon>
              <div>
                <div class="stat-number">{{ categories.length }}</div>
                <div class="stat-label">Categories</div>
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
              <mat-label>Search expenses...</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input
                matInput
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch()"
                placeholder="Ref no, note..."
              />
              @if (searchQuery) {
                <button matSuffix mat-icon-button (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="category-field">
              <mat-label>Category</mat-label>
              <mat-icon matPrefix>folder_open</mat-icon>
              <mat-select [(ngModel)]="categoryFilter" (ngModelChange)="onCategoryChange()">
                <mat-option value="">All Categories</mat-option>
                @for (c of categories; track c.id) {
                  <mat-option [value]="c.id">{{ c.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div class="quick-links">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      <mat-card class="table-card">
        <mat-card-content>
          @if (loading) {
            <app-skeleton-loader [rows]="8" type="table"></app-skeleton-loader>
          } @else if (expenses.length === 0) {
            <div class="empty-state">
              <mat-icon class="empty-icon">receipt_long</mat-icon>
              @if (searchQuery || categoryFilter) {
                <h3>No expenses found</h3>
                <p>Try adjusting your search or filters</p>
                <button mat-button (click)="clearFilters()">Clear Filters</button>
              } @else {
                <h3>No expenses yet</h3>
                <p>Record your first expense to get started</p>
                <button mat-raised-button color="primary" routerLink="create">
                  <mat-icon>add</mat-icon>
                  New Expense
                </button>
              }
            </div>
          } @else {
            <table mat-table [dataSource]="expenses" class="expenses-table">

              <!-- Ref No Column -->
              <ng-container matColumnDef="refNo">
                <th mat-header-cell *matHeaderCellDef>Ref No</th>
                <td mat-cell *matCellDef="let e">
                  @if (e.refNo) {
                    <span class="ref-badge">{{ e.refNo }}</span>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
              </ng-container>

              <!-- Category Column -->
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let e">
                  @if (e.expenseCategory) {
                    <mat-chip class="category-chip">{{ e.expenseCategory.name }}</mat-chip>
                  } @else {
                    <span class="muted">Uncategorized</span>
                  }
                </td>
              </ng-container>

              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let e">
                  <div class="date-cell">
                    <mat-icon class="date-icon">calendar_today</mat-icon>
                    {{ e.expenseDate | date:'mediumDate' }}
                  </div>
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef class="text-right">Amount</th>
                <td mat-cell *matCellDef="let e" class="text-right">
                  {{ e.amount | number:'1.2-2' }}
                </td>
              </ng-container>

              <!-- Tax Column -->
              <ng-container matColumnDef="tax">
                <th mat-header-cell *matHeaderCellDef class="text-right">Tax</th>
                <td mat-cell *matCellDef="let e" class="text-right muted">
                  {{ e.taxAmount | number:'1.2-2' }}
                </td>
              </ng-container>

              <!-- Total Column -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
                <td mat-cell *matCellDef="let e" class="text-right total-cell">
                  {{ e.totalAmount | number:'1.2-2' }}
                </td>
              </ng-container>

              <!-- Note Column -->
              <ng-container matColumnDef="note">
                <th mat-header-cell *matHeaderCellDef>Note</th>
                <td mat-cell *matCellDef="let e">
                  <span class="note-text" [matTooltip]="e.note || ''">
                    {{ e.note ? (e.note.length > 40 ? (e.note | slice:0:40) + '…' : e.note) : '—' }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let e">
                  <div class="action-buttons">
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="delete(e.id)"
                      matTooltip="Delete expense"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="expense-row"></tr>
            </table>

            <mat-paginator
              [length]="total"
              [pageSize]="limit"
              [pageSizeOptions]="[10, 20, 50, 100]"
              [pageIndex]="page - 1"
              (page)="onPageChange($event)"
              showFirstLastButtons
            ></mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .expenses-container {
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

      &.blue   { color: #1976d2; background: #e3f2fd; }
      &.green  { color: #388e3c; background: #e8f5e9; }
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

    .category-field {
      min-width: 200px;
    }

    .quick-links {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }

    .table-card {
      border-radius: 12px;
      overflow: hidden;
    }

    .expenses-table {
      width: 100%;
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

    .ref-badge {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 2px 8px;
      font-family: monospace;
      font-size: 0.85rem;
      color: #333;
    }

    .category-chip {
      background: #e3f2fd;
      color: #1976d2;
      font-size: 0.75rem;
    }

    .date-cell {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #444;
    }

    .date-icon {
      font-size: 0.95rem;
      width: 0.95rem;
      height: 0.95rem;
      color: #9e9e9e;
    }

    .text-right {
      text-align: right !important;
    }

    .total-cell {
      font-weight: 600;
      color: #1a1a1a;
    }

    .muted {
      color: #9e9e9e;
    }

    .note-text {
      color: #555;
      font-size: 0.875rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .expense-row {
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
export class ExpensesComponent implements OnInit {
  loading = false;
  summary: ExpenseSummary | null = null;
  expenses: Expense[] = [];
  categories: ExpenseCategory[] = [];

  searchQuery = '';
  categoryFilter: number | '' = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 1;

  displayedColumns = ['refNo', 'category', 'date', 'amount', 'tax', 'total', 'note', 'actions'];

  private searchTimer: any;

  constructor(
    private expensesService: ExpensesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.expensesService.getSummary().subscribe((s) => { this.summary = s; this.cdr.markForCheck(); });
    this.expensesService.getCategories().subscribe((c) => { this.categories = c; this.cdr.markForCheck(); });
    this.load();
  }

  load() {
    this.loading = true;
    this.expensesService
      .getAll({
        search: this.searchQuery || undefined,
        categoryId: this.categoryFilter ? +this.categoryFilter : undefined,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.expenses = res.data;
          this.total = res.total;
          this.totalPages = res.totalPages;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
          this.snackBar.open('Failed to load expenses', 'Close', { duration: 4000 });
        },
      });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.load();
    }, 300);
  }

  onCategoryChange() {
    this.page = 1;
    this.load();
  }

  clearSearch() {
    this.searchQuery = '';
    this.page = 1;
    this.load();
  }

  clearFilters() {
    this.searchQuery = '';
    this.categoryFilter = '';
    this.page = 1;
    this.load();
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.load();
  }

  delete(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Expense', message: 'Delete this expense? This action cannot be undone.', confirmColor: 'warn' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.expensesService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Expense deleted', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.load();
          this.expensesService.getSummary().subscribe((s) => { this.summary = s; this.cdr.markForCheck(); });
        },
        error: () => this.snackBar.open('Failed to delete expense', 'Close', { duration: 4000 }),
      });
    });
  }
}
