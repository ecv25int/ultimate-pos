import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class StockAdjustmentLineDto {
  @IsOptional()
  @IsNumber()
  variationId?: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class CreateStockAdjustmentDto {
  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsIn(['normal', 'abnormal'])
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
