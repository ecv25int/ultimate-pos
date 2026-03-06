export type NotificationType = 'low_stock' | 'sale' | 'purchase' | 'info' | 'warning' | 'error';

export interface Notification {
  id: number;
  businessId: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const NOTIFICATION_ICON: Record<NotificationType, string> = {
  low_stock: 'inventory_2',
  sale: 'shopping_cart',
  purchase: 'local_shipping',
  info: 'info',
  warning: 'warning',
  error: 'error',
};

export const NOTIFICATION_COLOR: Record<NotificationType, string> = {
  low_stock: '#ff9800',
  sale: '#4caf50',
  purchase: '#2196f3',
  info: '#00bcd4',
  warning: '#ff9800',
  error: '#f44336',
};
