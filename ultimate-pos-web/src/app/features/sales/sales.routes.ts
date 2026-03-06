import { Routes } from '@angular/router';

export const salesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sales.component').then((m) => m.SalesComponent),
    title: 'Sales - Ultimate POS',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./sale-form/sale-form.component').then((m) => m.SaleFormComponent),
    title: 'New Sale - Ultimate POS',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./sale-detail/sale-detail.component').then((m) => m.SaleDetailComponent),
    title: 'Sale Detail - Ultimate POS',
  },
];
