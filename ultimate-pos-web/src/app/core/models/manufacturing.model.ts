export interface MfgIngredientGroup {
  id: number;
  businessId: number;
  name: string;
  description: string | null;
}

export interface MfgRecipeIngredient {
  id: number;
  mfgRecipeId: number;
  variationId: number;
  quantity: number;
  subUnitId: number | null;
  mfgIngredientGroupId: number | null;
  wastePercent: number;
  ingredientGroup?: MfgIngredientGroup | null;
}

export interface MfgRecipe {
  id: number;
  productId: number;
  variationId: number;
  instructions: string | null;
  wastePercent: number;
  ingredientsCost: number;
  extraCost: number;
  totalQuantity: number;
  finalPrice: number;
  subUnitId: number | null;
  createdBy: number;
  ingredients?: MfgRecipeIngredient[];
}

export interface CreateIngredientGroupDto {
  name: string;
  description?: string;
}

export interface CreateRecipeIngredientDto {
  variationId: number;
  quantity: number;
  subUnitId?: number;
  mfgIngredientGroupId?: number;
  wastePercent?: number;
}

export interface CreateRecipeDto {
  productId: number;
  variationId: number;
  instructions?: string;
  wastePercent?: number;
  extraCost?: number;
  totalQuantity?: number;
  finalPrice: number;
  subUnitId?: number;
  ingredients?: CreateRecipeIngredientDto[];
}

export interface UpdateRecipeDto {
  instructions?: string;
  wastePercent?: number;
  extraCost?: number;
  totalQuantity?: number;
  finalPrice?: number;
  ingredients?: CreateRecipeIngredientDto[];
}
