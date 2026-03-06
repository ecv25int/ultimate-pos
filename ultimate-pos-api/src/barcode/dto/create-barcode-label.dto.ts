import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';

export class CreateBarcodeLabelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['name_price', 'name_sku_price', 'name_sku', 'custom'])
  stickerType?: string;

  @IsOptional()
  @IsIn(['C128', 'QR', 'C39', 'EAN13', 'UPCA'])
  barcodeType?: string;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  paperWidth?: number;

  @IsOptional()
  @IsNumber()
  paperHeight?: number;

  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
