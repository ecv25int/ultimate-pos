import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsEnum, MinLength, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

enum ProductType {
  SINGLE = 'single',
  VARIABLE = 'variable',
}

enum BarcodeType {
  C39 = 'C39',
  C128 = 'C128',
  EAN13 = 'EAN-13',
  EAN8 = 'EAN-8',
  UPCA = 'UPC-A',
  UPCE = 'UPC-E',
  ITF14 = 'ITF-14',
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: string;

  @IsInt()
  @Type(() => Number)
  unitId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  brandId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subCategoryId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  sku: string;

  @IsOptional()
  @IsEnum(BarcodeType)
  barcodeType?: string;

  @IsOptional()
  @IsBoolean()
  enableStock?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  alertQuantity?: number;
}
