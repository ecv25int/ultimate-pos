import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    title: 'Settings - Ultimate POS',
    component: SettingsComponent,
    children: [
      {
        path: 'tax-rates',
        title: 'Tax Rates - Ultimate POS',
        loadComponent: () =>
          import('./tax-rates/tax-rates.component').then(
            (m) => m.TaxRatesSettingsComponent,
          ),
      },
      {
        path: 'users',
        title: 'User Management - Ultimate POS',
        loadComponent: () =>
          import('./users/users.component').then(
            (m) => m.UsersSettingsComponent,
          ),
      },
      {
        path: 'business-locations',
        title: 'Business Locations - Ultimate POS',
        loadComponent: () =>
          import('./business-locations/business-locations.component').then(
            (m) => m.BusinessLocationsSettingsComponent,
          ),
      },
      {
        path: 'invoice-settings',
        title: 'Invoice Settings - Ultimate POS',
        loadComponent: () =>
          import('./invoice-settings/invoice-settings.component').then(
            (m) => m.InvoiceSettingsComponent,
          ),
      },
      {
        path: 'customer-groups',
        title: 'Customer Groups - Ultimate POS',
        loadComponent: () =>
          import('./customer-groups/customer-groups.component').then(
            (m) => m.CustomerGroupsSettingsComponent,
          ),
      },
      {
        path: 'selling-price-groups',
        title: 'Selling Price Groups - Ultimate POS',
        loadComponent: () =>
          import('./selling-price-groups/selling-price-groups.component').then(
            (m) => m.SellingPriceGroupsSettingsComponent,
          ),
      },
      {
        path: 'discounts',
        title: 'Discounts - Ultimate POS',
        loadComponent: () =>
          import('./discounts/discounts.component').then(
            (m) => m.DiscountsSettingsComponent,
          ),
      },
      {
        path: 'warranties',
        title: 'Warranties - Ultimate POS',
        loadComponent: () =>
          import('./warranties/warranties.component').then(
            (m) => m.WarrantiesSettingsComponent,
          ),
      },
      {
        path: 'notification-templates',
        title: 'Notification Templates - Ultimate POS',
        loadComponent: () =>
          import('./notification-templates/notification-templates.component').then(
            (m) => m.NotificationTemplatesSettingsComponent,
          ),
      },
      {
        path: 'variation-templates',
        title: 'Variation Templates - Ultimate POS',
        loadComponent: () =>
          import('./variation-templates/variation-templates.component').then(
            (m) => m.VariationTemplatesSettingsComponent,
          ),
      },
      {
        path: 'barcode-labels',
        title: 'Barcode Labels - Ultimate POS',
        loadComponent: () =>
          import('./barcode-labels/barcode-labels.component').then(
            (m) => m.BarcodeLabelsSettingsComponent,
          ),
      },
      {
        path: 'audit-logs',
        title: 'Audit Log - Ultimate POS',
        loadComponent: () =>
          import('./audit-logs/audit-logs.component').then(
            (m) => m.AuditLogsSettingsComponent,
          ),
      },
      {
        path: 'sms-notifications',
        title: 'SMS Notifications - Ultimate POS',
        loadComponent: () =>
          import('./sms-notifications/sms-notifications.component').then(
            (m) => m.SmsNotificationsSettingsComponent,
          ),
      },
      {
        path: 'push-notifications',
        title: 'Push Notifications - Ultimate POS',
        loadComponent: () =>
          import('./push-notifications/push-notifications.component').then(
            (m) => m.PushNotificationsSettingsComponent,
          ),
      },
      {
        path: 'backup',
        title: 'Backup & Restore - Ultimate POS',
        loadComponent: () =>
          import('./backup/backup.component').then(
            (m) => m.BackupSettingsComponent,
          ),
      },
      {
        path: 'scheduled-reports',
        title: 'Scheduled Reports - Ultimate POS',
        loadComponent: () =>
          import('./scheduled-reports/scheduled-reports.component').then(
            (m) => m.ScheduledReportsSettingsComponent,
          ),
      },
      {
        path: 'cash-drawer',
        title: 'Cash Drawer - Ultimate POS',
        loadComponent: () =>
          import('./cash-drawer/cash-drawer.component').then(
            (m) => m.CashDrawerSettingsComponent,
          ),
      },
    ],
  },
];

