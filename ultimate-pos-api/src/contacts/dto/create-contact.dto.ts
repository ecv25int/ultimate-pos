import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsEmail,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ContactType {
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
  BOTH = 'both',
}

export enum PayTermType {
  DAYS = 'days',
  MONTHS = 'months',
}

export enum ContactStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class CreateContactDto {
  @IsEnum(ContactType)
  type: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplierBusinessName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxNumber?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  mobile: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  landline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  alternateNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  payTermNumber?: number;

  @IsOptional()
  @IsEnum(PayTermType)
  payTermType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  creditLimit?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsEnum(ContactStatus)
  contactStatus?: string;
}
