import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountTypeDto {
  @IsString()
  name: string;

  @IsIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
  rootType: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentAccountTypeId?: number;
}
