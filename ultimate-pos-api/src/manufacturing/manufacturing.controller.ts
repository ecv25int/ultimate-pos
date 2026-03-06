import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  Query, Req, UseGuards,
} from '@nestjs/common';
import { ManufacturingService } from './manufacturing.service';
import { CreateIngredientGroupDto, CreateRecipeDto, UpdateRecipeDto } from './dto/manufacturing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('api/manufacturing')
export class ManufacturingController {
  constructor(private readonly manufacturingService: ManufacturingService) {}

  // Ingredient Groups
  @Get('ingredient-groups')
  getIngredientGroups(@Req() req: any) {
    return this.manufacturingService.getIngredientGroups(req.user.businessId);
  }

  @Post('ingredient-groups')
  createIngredientGroup(@Req() req: any, @Body() dto: CreateIngredientGroupDto) {
    return this.manufacturingService.createIngredientGroup(req.user.businessId, dto);
  }

  @Delete('ingredient-groups/:id')
  deleteIngredientGroup(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.manufacturingService.deleteIngredientGroup(req.user.businessId, id);
  }

  // Recipes
  @Get('recipes')
  getRecipes(@Query('productId') productId?: string) {
    return this.manufacturingService.getRecipes({
      productId: productId ? parseInt(productId, 10) : undefined,
    });
  }

  @Get('recipes/:id')
  getRecipe(@Param('id', ParseIntPipe) id: number) {
    return this.manufacturingService.getRecipe(id);
  }

  @Post('recipes')
  createRecipe(@Req() req: any, @Body() dto: CreateRecipeDto) {
    return this.manufacturingService.createRecipe(req.user.id, dto);
  }

  @Patch('recipes/:id')
  updateRecipe(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.manufacturingService.updateRecipe(id, req.user.id, dto);
  }

  @Delete('recipes/:id')
  deleteRecipe(@Param('id', ParseIntPipe) id: number) {
    return this.manufacturingService.deleteRecipe(id);
  }
}
