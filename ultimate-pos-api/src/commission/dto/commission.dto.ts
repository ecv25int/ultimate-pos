import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsPositive,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CommissionType {
  INVOICE_VALUE = 'invoice_value',
  PAYMENT_RECEIVED = 'payment_received',
}

export class CalculateCommissionDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(CommissionType)
  type?: CommissionType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  commissionRate?: number;
}

export class ProcessCommissionPaymentDto {
  @IsInt()
  @Type(() => Number)
  salesPersonId: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  commissionExpenseAccountId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bankOrCashAccountId?: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  entryDate?: string;
}
