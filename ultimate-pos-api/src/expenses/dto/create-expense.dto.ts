import { IsString, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateExpenseDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expenseCategoryId?: number;

  @IsOptional()
  @IsString()
  refNo?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}
