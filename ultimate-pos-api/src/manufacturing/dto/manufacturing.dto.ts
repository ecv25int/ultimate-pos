import { IsString, IsOptional, IsInt, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Ingredient Group ─────────────────────────────────────────────────────────

export class CreateIngredientGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// ─── Recipe ───────────────────────────────────────────────────────────────────

export class CreateRecipeIngredientDto {
  @IsInt()
  @Type(() => Number)
  variationId: number;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subUnitId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  mfgIngredientGroupId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  wastePercent?: number;
}

export class CreateRecipeDto {
  @IsInt()
  @Type(() => Number)
  productId: number;

  @IsInt()
  @Type(() => Number)
  variationId: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  wastePercent?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  extraCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalQuantity?: number;

  @IsNumber()
  @Type(() => Number)
  finalPrice: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subUnitId?: number;

  @IsOptional()
  ingredients?: CreateRecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  wastePercent?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  extraCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  finalPrice?: number;

  @IsOptional()
  ingredients?: CreateRecipeIngredientDto[];
}
