import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountDto {
  @IsInt()
  @Type(() => Number)
  accountTypeId: number;

  @IsString()
  name: string;

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  accountTypeId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}
