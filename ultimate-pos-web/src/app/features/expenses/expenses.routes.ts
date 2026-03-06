import { Routes } from '@angular/router';

export const expensesRoutes: Routes = [
  {
    path: '',
    title: 'Expenses - Ultimate POS',
    loadComponent: () =>
      import('./expenses.component').then((m) => m.ExpensesComponent),
  },
  {
    path: 'create',
    title: 'Add Expense - Ultimate POS',
    loadComponent: () =>
      import('./expense-form/expense-form.component').then(
        (m) => m.ExpenseFormComponent,
      ),
  },
];
