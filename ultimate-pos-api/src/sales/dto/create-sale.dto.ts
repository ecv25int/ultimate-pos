import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SaleStatus {
  DRAFT = 'draft',
  FINAL = 'final',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export enum SaleType {
  SALE = 'sale',
  SALE_RETURN = 'sale_return',
  QUOTATION = 'quotation',
}

export enum PaymentStatus {
  DUE = 'due',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum DiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

export class CreateSaleLineDto {
  @IsInt()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateSaleDto {
  @IsOptional()
  @IsInt()
  contactId?: number;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsEnum(SaleType)
  type?: SaleType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleLineDto)
  lines: CreateSaleLineDto[];
}
