import { Routes } from '@angular/router';

export const posRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pos.component').then((m) => m.PosComponent),
    title: 'POS - Ultimate POS',
  },
];
