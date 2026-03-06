import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/enums/user-role.enum';

export const businessRoutes: Routes = [
  {
    path: '',
    title: 'Businesses - Ultimate POS',
    loadComponent: () =>
      import('./business-list/business-list.component').then(
        (m) => m.BusinessListComponent
      ),
  },
  {
    path: 'create',
    title: 'Add Business - Ultimate POS',
    canActivate: [roleGuard([UserRole.ADMIN])],
    loadComponent: () =>
      import('./business-form/business-form.component').then(
        (m) => m.BusinessFormComponent
      ),
  },
  {
    path: 'edit/:id',
    title: 'Edit Business - Ultimate POS',
    canActivate: [roleGuard([UserRole.ADMIN, UserRole.MANAGER])],
    loadComponent: () =>
      import('./business-form/business-form.component').then(
        (m) => m.BusinessFormComponent
      ),
  },
];
