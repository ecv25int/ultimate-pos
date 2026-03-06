import { IsString, IsOptional, IsInt, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Asset ────────────────────────────────────────────────────────────────────

export class CreateAssetDto {
  @IsString()
  assetCode: string;

  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  unitPrice: number;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNo?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  locationId?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  purchaseType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  depreciation?: number;

  @IsOptional()
  @IsBoolean()
  isAllocatable?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @IsOptional()
  @IsBoolean()
  isAllocatable?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

// ─── Asset Transaction ────────────────────────────────────────────────────────

export class CreateAssetTransactionDto {
  @IsInt()
  @Type(() => Number)
  assetId: number;

  @IsString()
  transactionType: string;

  @IsString()
  refNo: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsDateString()
  transactionDatetime: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  receiver?: number;

  @IsOptional()
  @IsDateString()
  allocatedUpto?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

// ─── Asset Maintenance ────────────────────────────────────────────────────────

export class CreateMaintenanceDto {
  @IsInt()
  @Type(() => Number)
  assetId: number;

  @IsOptional()
  @IsString()
  maitenanceId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  assignedTo?: number;

  @IsOptional()
  @IsString()
  details?: string;
}

// ─── Asset Warranty ───────────────────────────────────────────────────────────

export class CreateWarrantyDto {
  @IsInt()
  @Type(() => Number)
  assetId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  additionalCost?: number;

  @IsOptional()
  @IsString()
  additionalNote?: string;
}
