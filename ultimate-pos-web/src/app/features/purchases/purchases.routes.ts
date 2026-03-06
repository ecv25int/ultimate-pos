import { Routes } from '@angular/router';

export const purchasesRoutes: Routes = [
  {
    path: '',
    title: 'Purchases - Ultimate POS',
    loadComponent: () =>
      import('./purchases.component').then((m) => m.PurchasesComponent),
  },
  {
    path: 'create',
    title: 'New Purchase - Ultimate POS',
    loadComponent: () =>
      import('./purchase-form/purchase-form.component').then(
        (m) => m.PurchaseFormComponent,
      ),
  },
  {
    path: ':id',
    title: 'Purchase Detail - Ultimate POS',
    loadComponent: () =>
      import('./purchase-detail/purchase-detail.component').then(
        (m) => m.PurchaseDetailComponent,
      ),
  },
];
