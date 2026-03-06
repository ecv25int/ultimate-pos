export interface StockAdjustmentLine {
  id: number;
  adjustmentId: number;
  variationId?: number;
  quantity: number;
  unitPrice: number;
  variation?: { id: number; name: string; subSku?: string };
}

export interface StockAdjustment {
  id: number;
  businessId: number;
  locationId?: number;
  referenceNo?: string;
  adjustmentType: 'normal' | 'abnormal';
  totalAmount: number;
  note?: string;
  status: string;
  finalised: boolean;
  finalisedAt?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  location?: { id: number; name: string };
  lines?: StockAdjustmentLine[];
}

export interface CreateStockAdjustmentLineDto {
  variationId?: number;
  quantity: number;
  unitPrice?: number;
}

export interface CreateStockAdjustmentDto {
  locationId?: number;
  referenceNo?: string;
  adjustmentType?: 'normal' | 'abnormal';
  note?: string;
  status?: string;
  lines?: CreateStockAdjustmentLineDto[];
}

export interface BarcodeLabel {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  stickerType: 'name_price' | 'name_sku_price' | 'name_sku' | 'custom';
  barcodeType: 'C128' | 'QR' | 'C39' | 'EAN13' | 'UPCA';
  width?: number;
  height?: number;
  paperWidth?: number;
  paperHeight?: number;
  fontSize?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBarcodeLabelDto {
  name: string;
  description?: string;
  stickerType?: 'name_price' | 'name_sku_price' | 'name_sku' | 'custom';
  barcodeType?: 'C128' | 'QR' | 'C39' | 'EAN13' | 'UPCA';
  width?: number;
  height?: number;
  paperWidth?: number;
  paperHeight?: number;
  fontSize?: number;
  isDefault?: boolean;
}

export interface BarcodeGenerateResult {
  product: { id: number; name: string; sku: string };
  label: BarcodeLabel | null;
  barcodes: { variationId: number; variationName: string; barcodeValue: string }[];
}
