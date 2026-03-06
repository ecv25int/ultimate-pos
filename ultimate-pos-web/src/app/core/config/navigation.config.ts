export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
  },
  {
    label: 'Products',
    icon: 'inventory_2',
    route: '/products',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Inventory',
    icon: 'warehouse',
    route: '/inventory',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Purchases',
    icon: 'shopping_cart',
    route: '/purchases',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Sales',
    icon: 'receipt',
    route: '/sales',
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    label: 'POS',
    icon: 'point_of_sale',
    route: '/pos',
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    label: 'Reports',
    icon: 'assessment',
    route: '/reports',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Expenses',
    icon: 'receipt_long',
    route: '/expenses',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Cash Register',
    icon: 'point_of_sale',
    route: '/cash-register',
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    label: 'Contacts',
    icon: 'people',
    route: '/contacts',
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    label: 'Business',
    icon: 'business',
    route: '/business',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Settings',
    icon: 'settings',
    route: '/settings',
    roles: ['admin'],
  },
  {
    label: 'Import / Export',
    icon: 'import_export',
    route: '/import-export',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Notifications',
    icon: 'notifications',
    route: '/notifications',
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    label: 'Tax Rates',
    icon: 'percent',
    route: '/tax-rates',
    roles: ['admin'],
  },
  {
    label: 'Stock Adjustments',
    icon: 'tune',
    route: '/stock-adjustments',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Stock Transfers',
    icon: 'swap_horiz',
    route: '/stock-transfers',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Payments',
    icon: 'payments',
    route: '/payments',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Barcodes',
    icon: 'qr_code',
    route: '/products/barcodes',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Accounting',
    icon: 'account_balance',
    route: '/accounting',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Restaurant',
    icon: 'restaurant',
    route: '/restaurant',
    roles: ['admin', 'manager'],
  },
  {
    label: 'CRM',
    icon: 'people_alt',
    route: '/crm',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Manufacturing',
    icon: 'precision_manufacturing',
    route: '/manufacturing',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Repair',
    icon: 'build',
    route: '/repair',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Assets',
    icon: 'inventory_2',
    route: '/asset-management',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Projects',
    icon: 'folder_open',
    route: '/project',
    roles: ['admin', 'manager'],
  },
  {
    label: 'HR & Docs',
    icon: 'badge',
    route: '/essentials',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Hotel (HMS)',
    icon: 'hotel',
    route: '/hms',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Superadmin',
    icon: 'admin_panel_settings',
    route: '/superadmin',
    roles: ['admin'],
  },
  {
    label: 'WooCommerce',
    icon: 'shopping_cart',
    route: '/woocommerce',
    roles: ['admin', 'manager'],
  },
];
