import { Routes } from '@angular/router';

export const cashRegisterRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./cash-register.component').then(
        (m) => m.CashRegisterComponent,
      ),
  },
];
