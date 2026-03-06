import {
  IsString, IsEmail, IsOptional, IsBoolean, IsInt, MaxLength, Min,
} from 'class-validator';

export class CreateInvoiceLayoutDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  headerText?: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  invoiceHeading?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNoLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dateLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dueDateLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  highlightColor?: string;

  @IsOptional()
  @IsString()
  subHeading1?: string;

  @IsOptional()
  @IsString()
  subHeading2?: string;

  @IsOptional()
  @IsString()
  subHeading3?: string;

  @IsOptional()
  @IsString()
  subHeading4?: string;

  @IsOptional()
  @IsString()
  subHeading5?: string;

  @IsOptional()
  @IsBoolean()
  showBusinessName?: boolean;

  @IsOptional()
  @IsBoolean()
  showLocationName?: boolean;

  @IsOptional()
  @IsBoolean()
  showMobileNumber?: boolean;

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  showTax1?: boolean;

  @IsOptional()
  @IsBoolean()
  showTax2?: boolean;

  @IsOptional()
  @IsBoolean()
  showTaxTotal?: boolean;

  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @IsOptional()
  @IsBoolean()
  showBarcode?: boolean;

  @IsOptional()
  @IsBoolean()
  showPaymentMethods?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
