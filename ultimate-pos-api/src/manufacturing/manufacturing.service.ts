import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateIngredientGroupDto,
  CreateRecipeDto,
  UpdateRecipeDto,
} from './dto/manufacturing.dto';

@Injectable()
export class ManufacturingService {
  constructor(private prisma: PrismaService) {}

  // ─── Ingredient Groups ─────────────────────────────────────────────────────

  async getIngredientGroups(businessId: number) {
    return this.prisma.mfgIngredientGroup.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
  }

  async createIngredientGroup(businessId: number, dto: CreateIngredientGroupDto) {
    return this.prisma.mfgIngredientGroup.create({
      data: {
        businessId,
        name: dto.name,
        description: dto.description ?? null,
      },
    });
  }

  async deleteIngredientGroup(businessId: number, id: number) {
    const g = await this.prisma.mfgIngredientGroup.findFirst({
      where: { id, businessId },
    });
    if (!g) throw new NotFoundException(`Ingredient group ${id} not found`);
    await this.prisma.mfgIngredientGroup.delete({ where: { id } });
    return { success: true };
  }

  // ─── Recipes ───────────────────────────────────────────────────────────────

  async getRecipes(filters?: { productId?: number }) {
    return this.prisma.mfgRecipe.findMany({
      where: filters?.productId ? { productId: filters.productId } : undefined,
      include: {
        ingredients: {
          include: { ingredientGroup: true },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async getRecipe(id: number) {
    const recipe = await this.prisma.mfgRecipe.findUnique({
      where: { id },
      include: { ingredients: { include: { ingredientGroup: true } } },
    });
    if (!recipe) throw new NotFoundException(`Recipe ${id} not found`);
    return recipe;
  }

  async createRecipe(userId: number, dto: CreateRecipeDto) {
    const { ingredients, ...recipeData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.mfgRecipe.create({
        data: {
          productId: recipeData.productId,
          variationId: recipeData.variationId,
          instructions: recipeData.instructions ?? null,
          wastePercent: recipeData.wastePercent ?? 0,
          ingredientsCost: 0,
          extraCost: recipeData.extraCost ?? 0,
          totalQuantity: recipeData.totalQuantity ?? 0,
          finalPrice: recipeData.finalPrice,
          subUnitId: recipeData.subUnitId ?? null,
          createdBy: userId,
        },
      });
      if (ingredients?.length) {
        await tx.mfgRecipeIngredient.createMany({
          data: ingredients.map((i) => ({
            mfgRecipeId: recipe.id,
            variationId: i.variationId,
            quantity: i.quantity,
            subUnitId: i.subUnitId ?? null,
            mfgIngredientGroupId: i.mfgIngredientGroupId ?? null,
            wastePercent: i.wastePercent ?? 0,
          })),
        });
      }
      return tx.mfgRecipe.findUnique({
        where: { id: recipe.id },
        include: { ingredients: true },
      });
    });
  }

  async updateRecipe(id: number, userId: number, dto: UpdateRecipeDto) {
    const existing = await this.prisma.mfgRecipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Recipe ${id} not found`);

    const { ingredients, ...recipeData } = dto;
    return this.prisma.$transaction(async (tx) => {
      await tx.mfgRecipe.update({
        where: { id },
        data: {
          ...(recipeData.instructions !== undefined && { instructions: recipeData.instructions }),
          ...(recipeData.wastePercent !== undefined && { wastePercent: recipeData.wastePercent }),
          ...(recipeData.extraCost !== undefined && { extraCost: recipeData.extraCost }),
          ...(recipeData.totalQuantity !== undefined && { totalQuantity: recipeData.totalQuantity }),
          ...(recipeData.finalPrice !== undefined && { finalPrice: recipeData.finalPrice }),
        },
      });
      if (ingredients !== undefined) {
        await tx.mfgRecipeIngredient.deleteMany({ where: { mfgRecipeId: id } });
        if (ingredients.length) {
          await tx.mfgRecipeIngredient.createMany({
            data: ingredients.map((i) => ({
              mfgRecipeId: id,
              variationId: i.variationId,
              quantity: i.quantity,
              subUnitId: i.subUnitId ?? null,
              mfgIngredientGroupId: i.mfgIngredientGroupId ?? null,
              wastePercent: i.wastePercent ?? 0,
            })),
          });
        }
      }
      return tx.mfgRecipe.findUnique({
        where: { id },
        include: { ingredients: true },
      });
    });
  }

  async deleteRecipe(id: number) {
    const existing = await this.prisma.mfgRecipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Recipe ${id} not found`);
    await this.prisma.mfgRecipe.delete({ where: { id } });
    return { success: true };
  }
}
