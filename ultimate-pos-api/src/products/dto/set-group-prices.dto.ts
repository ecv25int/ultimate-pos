import { IsInt, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupPriceDto {
  @IsInt()
  @Type(() => Number)
  variationId: number;

  @IsInt()
  @Type(() => Number)
  priceGroupId: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceIncTax: number;
}

export class SetGroupPricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGroupPriceDto)
  groupPrices: CreateGroupPriceDto[];
}
