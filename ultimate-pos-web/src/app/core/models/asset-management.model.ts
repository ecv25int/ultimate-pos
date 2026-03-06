export interface Asset {
  id: number;
  businessId: number;
  assetCode: string;
  name: string;
  quantity: number;
  model: string | null;
  serialNo: string | null;
  categoryId: number | null;
  locationId: number | null;
  purchaseDate: string | null;
  purchaseType: string | null;
  unitPrice: number;
  depreciation: number | null;
  isAllocatable: boolean;
  description: string | null;
  createdBy: number;
  warranties?: AssetWarranty[];
  _count?: { transactions: number; maintenances: number };
}

export interface AssetTransaction {
  id: number;
  businessId: number;
  assetId: number | null;
  transactionType: string;
  refNo: string;
  receiver: number | null;
  quantity: number;
  transactionDatetime: string;
  allocatedUpto: string | null;
  reason: string | null;
  createdBy: number;
  asset?: { id: number; name: string; assetCode: string } | null;
}

export interface AssetWarranty {
  id: number;
  assetId: number;
  startDate: string;
  endDate: string;
  additionalCost: number;
  additionalNote: string | null;
}

export interface AssetMaintenance {
  id: string;
  businessId: number;
  assetId: number;
  maitenanceId: string | null;
  status: string | null;
  priority: string | null;
  createdBy: number;
  assignedTo: number | null;
  details: string | null;
  asset?: { id: number; name: string } | null;
}

export interface AssetDashboard {
  totalAssets: number;
  allocatedCount: number;
  maintenancePending: number;
  expiringWarranties: number;
}

export interface CreateAssetDto {
  assetCode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  model?: string;
  serialNo?: string;
  categoryId?: number;
  locationId?: number;
  purchaseDate?: string;
  purchaseType?: string;
  depreciation?: number;
  isAllocatable?: boolean;
  description?: string;
}

export interface CreateAssetTransactionDto {
  assetId: number;
  transactionType: string;
  refNo: string;
  quantity: number;
  transactionDatetime: string;
  receiver?: number;
  allocatedUpto?: string;
  reason?: string;
}

export interface CreateMaintenanceDto {
  assetId: number;
  maitenanceId?: string;
  status?: string;
  priority?: string;
  assignedTo?: number;
  details?: string;
}

export interface CreateWarrantyDto {
  assetId: number;
  startDate: string;
  endDate: string;
  additionalCost?: number;
  additionalNote?: string;
}

export interface UpdateAssetDto {
  name?: string;
  model?: string;
  serialNo?: string;
  assetFor?: string;
  quantity?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  categoryId?: number;
  locationId?: number;
  customFields?: Record<string, unknown>;
}
