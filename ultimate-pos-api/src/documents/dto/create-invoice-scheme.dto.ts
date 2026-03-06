import { IsString, IsOptional, IsBoolean, IsInt, MaxLength, Min } from 'class-validator';

export class CreateInvoiceSchemeDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  prefix?: string;

  @IsOptional()
  @IsInt()
  invoiceLayoutId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  startNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalDigits?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
