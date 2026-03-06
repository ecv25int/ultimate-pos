import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './core/components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth-routing-module').then((m) => m.authRoutes),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (m) => m.dashboardRoutes,
          ),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then(
            (m) => m.productsRoutes,
          ),
      },
      {
        path: 'contacts',
        loadChildren: () =>
          import('./features/contacts/contacts.routes').then(
            (m) => m.contactsRoutes,
          ),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/inventory/inventory.routes').then(
            (m) => m.inventoryRoutes,
          ),
      },
      {
        path: 'sales',
        loadChildren: () =>
          import('./features/sales/sales.routes').then((m) => m.salesRoutes),
      },
      {
        path: 'pos',
        loadChildren: () =>
          import('./features/pos/pos.routes').then((m) => m.posRoutes),
      },
      {
        path: 'purchases',
        loadChildren: () =>
          import('./features/purchases/purchases.routes').then(
            (m) => m.purchasesRoutes,
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then(
            (m) => m.reportsRoutes,
          ),
      },
      {
        path: 'expenses',
        loadChildren: () =>
          import('./features/expenses/expenses.routes').then(
            (m) => m.expensesRoutes,
          ),
      },
      {
        path: 'cash-register',
        loadChildren: () =>
          import('./features/cash-register/cash-register.routes').then(
            (m) => m.cashRegisterRoutes,
          ),
      },
      {
        path: 'profile',
        title: 'My Profile - Ultimate POS',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'business',
        loadChildren: () =>
          import('./features/business/business.routes').then(
            (m) => m.businessRoutes,
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then(
            (m) => m.settingsRoutes,
          ),
      },
      {
        path: 'import-export',
        title: 'Import / Export - Ultimate POS',
        loadComponent: () =>
          import('./features/import-export/import-export.component').then(
            (m) => m.ImportExportComponent,
          ),
      },
      {
        path: 'notifications',
        title: 'Notifications - Ultimate POS',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
      },
      {
        path: 'tax-rates',
        title: 'Tax Rates - Ultimate POS',
        loadComponent: () =>
          import('./features/tax-rates/tax-rates.component').then(
            (m) => m.TaxRatesComponent,
          ),
      },
      {
        path: 'stock-adjustments',
        title: 'Stock Adjustments - Ultimate POS',
        loadComponent: () =>
          import('./features/stock-adjustments/stock-adjustments.component').then(
            (m) => m.StockAdjustmentsComponent,
          ),
      },
      {
        path: 'stock-transfers',
        title: 'Stock Transfers - Ultimate POS',
        loadComponent: () =>
          import('./features/stock-transfers/stock-transfers.component').then(
            (m) => m.StockTransfersComponent,
          ),
      },
      {
        path: 'payments',
        title: 'Payments - Ultimate POS',
        loadComponent: () =>
          import('./features/payments/payments.component').then(
            (m) => m.PaymentsComponent,
          ),
      },
      {
        path: 'accounting',
        title: 'Accounting - Ultimate POS',
        loadComponent: () =>
          import('./features/accounting/accounting.component').then(
            (m) => m.AccountingComponent,
          ),
      },
      {
        path: 'restaurant',
        title: 'Restaurant - Ultimate POS',
        loadComponent: () =>
          import('./features/restaurant/restaurant.component').then(
            (m) => m.RestaurantComponent,
          ),
      },
      {
        path: 'crm',
        title: 'CRM - Ultimate POS',
        loadComponent: () =>
          import('./features/crm/crm.component').then(
            (m) => m.CrmComponent,
          ),
      },
      {
        path: 'manufacturing',
        title: 'Manufacturing - Ultimate POS',
        loadComponent: () =>
          import('./features/manufacturing/manufacturing.component').then(
            (m) => m.ManufacturingComponent,
          ),
      },
      {
        path: 'repair',
        title: 'Repair - Ultimate POS',
        loadComponent: () =>
          import('./features/repair/repair.component').then(
            (m) => m.RepairComponent,
          ),
      },
      {
        path: 'asset-management',
        title: 'Asset Management - Ultimate POS',
        loadComponent: () =>
          import('./features/asset-management/asset-management.component').then(
            (m) => m.AssetManagementComponent,
          ),
      },
      {
        path: 'project',
        title: 'Project - Ultimate POS',
        loadComponent: () =>
          import('./features/project/project.component').then(
            (m) => m.ProjectComponent,
          ),
      },
      {
        path: 'essentials',
        title: 'Essentials - Ultimate POS',
        loadComponent: () =>
          import('./features/essentials/essentials.component').then(
            (m) => m.EssentialsComponent,
          ),
      },
      {
        path: 'hms',
        title: 'HMS - Ultimate POS',
        loadComponent: () =>
          import('./features/hms/hms.component').then(
            (m) => m.HmsComponent,
          ),
      },
      {
        path: 'superadmin',
        title: 'Super Admin - Ultimate POS',
        loadComponent: () =>
          import('./features/superadmin/superadmin.component').then(
            (m) => m.SuperadminComponent,
          ),
      },
      {
        path: 'woocommerce',
        title: 'WooCommerce - Ultimate POS',
        loadComponent: () =>
          import('./features/woocommerce/woocommerce.component').then(
            (m) => m.WoocommerceComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];

