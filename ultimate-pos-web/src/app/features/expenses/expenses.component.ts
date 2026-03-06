import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
  imports: [CommonModule, RouterModule, FormsModule, MatDialogModule, SkeletonLoaderComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Expenses</h1>
          <p>Track and manage business expenses</p>
        </div>
        <a routerLink="create" class="btn btn-primary">+ New Expense</a>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid" *ngIf="summary">
        <div class="stat-card">
          <span class="label">Total Expenses</span>
          <span class="value">{{ summary.total }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Total Amount</span>
          <span class="value">{{ summary.totalAmount | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card warning">
          <span class="label">Total Tax</span>
          <span class="value">{{ summary.totalTax | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card info">
          <span class="label">Categories</span>
          <span class="value">{{ categories.length }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input
          type="text"
          placeholder="Search by ref no or note..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch()"
          class="search-input"
        />
        <select [(ngModel)]="categoryFilter" (ngModelChange)="load()" class="filter-select">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-container">
        @if (loading) {
          <app-skeleton-loader [rows]="8" type="table"></app-skeleton-loader>
        } @else {
        <table class="data-table" *ngIf="expenses.length > 0; else empty">
          <thead>
            <tr>
              <th>Ref No</th>
              <th>Category</th>
              <th>Date</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Tax</th>
              <th class="text-right">Total</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of expenses">
              <td>{{ e.refNo || '—' }}</td>
              <td>{{ e.expenseCategory?.name || '—' }}</td>
              <td>{{ e.expenseDate | date:'mediumDate' }}</td>
              <td class="text-right">{{ e.amount | number:'1.2-2' }}</td>
              <td class="text-right">{{ e.taxAmount | number:'1.2-2' }}</td>
              <td class="text-right">{{ e.totalAmount | number:'1.2-2' }}</td>
              <td>{{ e.note || '—' }}</td>
              <td>
                <button class="action-link danger" (click)="delete(e.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <div class="empty-state">No expenses found.</div>
        </ng-template>
        }
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page === 1" (click)="changePage(page - 1)" class="btn btn-secondary">Prev</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page === totalPages" (click)="changePage(page + 1)" class="btn btn-secondary">Next</button>
      </div>
    </div>
  `,
})
export class ExpensesComponent implements OnInit {
  loading = false;
  summary: ExpenseSummary | null = null;
  expenses: Expense[] = [];
  categories: ExpenseCategory[] = [];

  searchQuery = '';
  categoryFilter = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 1;

  private searchTimer: any;

  constructor(private expensesService: ExpensesService, private dialog: MatDialog, private cdr: ChangeDetectorRef) {}

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
        error: () => { this.loading = false; this.cdr.markForCheck(); },
      });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.load();
    }, 300);
  }

  changePage(p: number) {
    this.page = p;
    this.load();
  }

  delete(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Expense', message: 'Delete this expense? This action cannot be undone.' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.expensesService.delete(id).subscribe(() => {
        this.expenses = this.expenses.filter((e) => e.id !== id);
        if (this.summary) this.summary.total--;
      });
    });
  }
}
