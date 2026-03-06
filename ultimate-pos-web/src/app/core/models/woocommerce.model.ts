export interface WoocommerceSyncLog {
  id: number;
  businessId: number;
  syncType: string;
  operationType?: 'created' | 'updated';
  data?: string;
  details?: string;
  createdBy: number;
  createdAt: string;
}

export interface WoocommerceStats {
  totalLogs: number;
  created: number;
  updated: number;
}

export interface CreateSyncLogDto { syncType: string; operationType?: 'created' | 'updated'; data?: string; details?: string; }
