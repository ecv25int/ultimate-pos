import { IsString, IsOptional, IsIn, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountTransactionDto {
  @Type(() => Number)
  accountId: number;

  @IsIn(['debit', 'credit'])
  type: string;

  @IsOptional()
  @IsIn(['opening_balance', 'fund_transfer', 'deposit', 'journal', 'sale', 'purchase', 'payment'])
  subType?: string;

  @IsNumber()
  @Min(0.0001)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsDateString()
  operationDate: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @Type(() => Number)
  linkedTransactionId?: number;
}
