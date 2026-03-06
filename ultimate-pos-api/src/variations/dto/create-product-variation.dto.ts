import { IsString, IsNotEmpty, MaxLength, IsInt, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateProductVariationDto {
  @IsInt()
  productId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsBoolean()
  isDummy?: boolean;
}
