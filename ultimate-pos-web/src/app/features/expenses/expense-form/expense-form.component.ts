import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ExpensesService } from '../../../core/services/expenses.service';
import {
  CreateExpenseDto,
  ExpenseCategory,
} from '../../../core/models/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>New Expense</h1>
          <p>Record a business expense</p>
        </div>
        <a routerLink="/expenses" class="btn btn-secondary">← Back</a>
      </div>

      <form class="form-card" (ngSubmit)="submit()">
        <div class="form-group">
          <label>Category</label>
          <select [(ngModel)]="form.expenseCategoryId" name="expenseCategoryId" class="form-control">
            <option [value]="undefined">— No Category —</option>
            <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Amount *</label>
          <input
            type="number"
            [(ngModel)]="form.amount"
            name="amount"
            required
            min="0"
            step="0.01"
            class="form-control"
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label>Tax Amount</label>
          <input
            type="number"
            [(ngModel)]="form.taxAmount"
            name="taxAmount"
            min="0"
            step="0.01"
            class="form-control"
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label>Expense Date</label>
          <input
            type="date"
            [(ngModel)]="form.expenseDate"
            name="expenseDate"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label>Note</label>
          <textarea
            [(ngModel)]="form.note"
            name="note"
            class="form-control"
            rows="3"
            placeholder="Optional note..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Save Expense' }}
          </button>
          <a routerLink="/expenses" class="btn btn-secondary">Cancel</a>
        </div>

        <div class="error-message" *ngIf="error">{{ error }}</div>
      </form>
    </div>
  `,
})
export class ExpenseFormComponent implements OnInit {
  categories: ExpenseCategory[] = [];
  form: CreateExpenseDto = { amount: 0, taxAmount: 0 };
  saving = false;
  error = '';

  constructor(private expensesService: ExpensesService, private router: Router) {}

  ngOnInit() {
    this.expensesService.getCategories().subscribe((c) => (this.categories = c));
    const today = new Date().toISOString().split('T')[0];
    this.form.expenseDate = today;
  }

  submit() {
    if (!this.form.amount) {
      this.error = 'Amount is required';
      return;
    }
    this.saving = true;
    this.error = '';
    this.expensesService.create(this.form).subscribe({
      next: () => this.router.navigate(['/expenses']),
      error: (err) => {
        this.error = err.error?.message || 'Failed to save expense';
        this.saving = false;
      },
    });
  }
}
