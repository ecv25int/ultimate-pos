import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DiscountableItemDto {
  @IsInt()
  @Type(() => Number)
  productId: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitPrice: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}

export class ApplyDiscountDto {
  @IsString()
  @IsNotEmpty()
  discountType: string;

  @IsNotEmpty()
  discountValue: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountableItemDto)
  items: DiscountableItemDto[];
}

export class ValidateDiscountDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
