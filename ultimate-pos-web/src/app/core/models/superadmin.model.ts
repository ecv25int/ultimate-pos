export interface Package {
  id: number;
  name: string;
  description: string;
  locationCount: number;
  userCount: number;
  productCount: number;
  invoiceCount: number;
  interval: 'days' | 'months' | 'years';
  intervalCount: number;
  trialDays: number;
  price: number;
  sortOrder: number;
  isActive: boolean;
  _count?: { subscriptions: number };
}

export interface Subscription {
  id: number;
  businessId: number;
  packageId: number;
  startDate?: string;
  trialEndDate?: string;
  endDate?: string;
  packagePrice: number;
  packageDetails: string;
  paidVia?: string;
  paymentTransactionId?: string;
  status: 'approved' | 'waiting' | 'declined';
  package?: Package;
}

export interface SuperadminDashboard {
  totalPackages: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  expiringIn30Days: number;
}

export interface CreatePackageDto { name: string; description: string; locationCount: number; userCount: number; productCount: number; invoiceCount: number; interval: string; intervalCount: number; trialDays: number; price: number; isActive: boolean; sortOrder?: number; }
export interface UpdatePackageDto { name?: string; price?: number; isActive?: boolean; sortOrder?: number; }
export interface CreateSubscriptionDto { businessId: number; packageId: number; startDate?: string; endDate?: string; packagePrice: number; packageDetails: string; paidVia?: string; }
