import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnLineDto {
  @IsInt()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreateSaleReturnDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnLineDto)
  lines: ReturnLineDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
