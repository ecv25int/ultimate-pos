import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCashRegisterDto {
  @IsNumber()
  @Min(0)
  openingAmount: number;

  @IsOptional()
  @IsString()
  openNote?: string;
}

export class AddTransactionDto {
  @IsEnum(['cash_in', 'cash_out', 'sale', 'refund'])
  transactionType: 'cash_in' | 'cash_out' | 'sale' | 'refund';

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;
}

export class CloseRegisterDto {
  @IsNumber()
  @Min(0)
  closingAmount: number;

  @IsOptional()
  @IsString()
  closingNote?: string;
}
