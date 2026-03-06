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

export enum PurchaseStatus {
  ORDERED = 'ordered',
  PENDING = 'pending',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export enum PurchasePaymentStatus {
  DUE = 'due',
  PARTIAL = 'partial',
  PAID = 'paid',
}

export enum PurchaseType {
  PURCHASE = 'purchase',
  REQUISITION = 'requisition',
}

export class CreatePurchaseLineDto {
  @IsInt()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCostBefore: number;

  @IsNumber()
  @Min(0)
  unitCostAfter: number;

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

export class CreatePurchaseDto {
  @IsOptional()
  @IsInt()
  contactId?: number;

  @IsOptional()
  @IsString()
  refNo?: string;

  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @IsOptional()
  @IsEnum(PurchasePaymentStatus)
  paymentStatus?: PurchasePaymentStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

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
  purchaseDate?: string;

  @IsOptional()
  @IsEnum(PurchaseType)
  type?: PurchaseType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseLineDto)
  lines: CreatePurchaseLineDto[];
}
