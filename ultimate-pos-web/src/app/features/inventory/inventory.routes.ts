import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  {
    path: '',
    title: 'Inventory - Ultimate POS',
    loadComponent: () =>
      import('./stock-overview/stock-overview.component').then(
        (m) => m.StockOverviewComponent,
      ),
  },
  {
    path: 'adjust',
    title: 'Stock Adjustment - Ultimate POS',
    loadComponent: () =>
      import('./stock-entry-form/stock-entry-form.component').then(
        (m) => m.StockEntryFormComponent,
      ),
  },
  {
    path: 'history/:id',
    title: 'Stock History - Ultimate POS',
    loadComponent: () =>
      import('./stock-history/stock-history.component').then(
        (m) => m.StockHistoryComponent,
      ),
  },
];
