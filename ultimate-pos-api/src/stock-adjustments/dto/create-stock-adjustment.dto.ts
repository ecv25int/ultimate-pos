import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class StockAdjustmentLineDto {
  @IsOptional()
  @IsNumber()
  variationId?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsString()
  @IsIn(['damage', 'expiry', 'missing', 'found', 'inventory_count'])
  reason?: string;

  @IsOptional()
  @IsNumber()
  actualQty?: number;
}

export class CreateStockAdjustmentDto {
  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsIn(['normal', 'abnormal', 'inventory_count'])
  adjustmentType?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsIn(['received', 'pending'])
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockAdjustmentLineDto)
  lines?: StockAdjustmentLineDto[];
}
