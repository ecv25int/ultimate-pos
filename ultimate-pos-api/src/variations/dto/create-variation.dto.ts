import {
  IsString, IsNotEmpty, MaxLength, IsInt, IsOptional, IsNumber, IsDecimal,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariationDto {
  @IsInt()
  productId: number;

  @IsInt()
  productVariationId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subSku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  defaultPurchasePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dppIncTax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  profitPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  defaultSellPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sellPriceIncTax?: number;
}
