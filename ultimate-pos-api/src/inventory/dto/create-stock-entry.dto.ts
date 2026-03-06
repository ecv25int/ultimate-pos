import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StockEntryType {
  OPENING_STOCK = 'opening_stock',
  PURCHASE_IN   = 'purchase_in',
  ADJUSTMENT_IN = 'adjustment_in',
  ADJUSTMENT_OUT = 'adjustment_out',
  SALE_OUT      = 'sale_out',
  SALE_RETURN   = 'sale_return',
}

export class CreateStockEntryDto {
  @IsInt()
  @Type(() => Number)
  productId: number;

  @IsEnum(StockEntryType)
  entryType: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;   // positive = in, negative = out

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost?: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
