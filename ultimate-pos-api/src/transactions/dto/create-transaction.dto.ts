import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export const TRANSACTION_TYPES = [
  'sale',
  'purchase',
  'expense',
  'stock_transfer',
  'stock_adjustment',
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export class CreateTransactionDto {
  @IsIn(TRANSACTION_TYPES)
  type: TransactionType;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  contactId?: number;

  @IsOptional()
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsInt()
  expenseCategoryId?: number;

  @IsOptional()
  @IsInt()
  productId?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsString()
  fromLocation?: string;

  @IsOptional()
  @IsString()
  toLocation?: string;

  @IsOptional()
  @IsString()
  adjustmentType?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBeforeTax?: number;

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
  totalAmount?: number;
}