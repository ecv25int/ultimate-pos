import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'check', 'other'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export class CreatePaymentDto {
  @IsOptional()
  @IsInt()
  saleId?: number;

  @IsOptional()
  @IsInt()
  purchaseId?: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsEnum(PAYMENT_METHODS)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  paymentDate?: string; // ISO date string
}

export class BulkPaymentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments: CreatePaymentDto[];
}
