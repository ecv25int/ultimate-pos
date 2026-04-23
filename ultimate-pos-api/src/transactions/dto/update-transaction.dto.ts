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
import { TRANSACTION_TYPES } from './create-transaction.dto';

export class UpdateTransactionDto {
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: (typeof TRANSACTION_TYPES)[number];

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