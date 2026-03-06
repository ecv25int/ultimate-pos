import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { VariationsService } from './variations.service';
import { CreateVariationTemplateDto } from './dto/create-variation-template.dto';
import { UpdateVariationTemplateDto } from './dto/update-variation-template.dto';
import { CreateVariationValueTemplateDto } from './dto/create-variation-value-template.dto';
import { CreateProductVariationDto } from './dto/create-product-variation.dto';
import { CreateVariationDto } from './dto/create-variation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('variations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VariationsController {
  constructor(private readonly variationsService: VariationsService) {}

  // ─── Variation Templates ──────────────────────────────────────────────────

  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createTemplate(@Request() req: any, @Body() dto: CreateVariationTemplateDto) {
    return this.variationsService.createTemplate(req.user.businessId, dto);
  }

  @Get('templates')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAllTemplates(@Request() req: any) {
    return this.variationsService.findAllTemplates(req.user.businessId);
  }

  @Get('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findOneTemplate(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.variationsService.findOneTemplate(id, req.user.businessId);
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: UpdateVariationTemplateDto,
  ) {
    return this.variationsService.updateTemplate(id, req.user.businessId, dto);
  }

  @Delete('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeTemplate(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.variationsService.removeTemplate(id, req.user.businessId);
  }

  // ─── Variation Value Templates ────────────────────────────────────────────

  @Post('value-templates')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createValueTemplate(@Request() req: any, @Body() dto: CreateVariationValueTemplateDto) {
    return this.variationsService.createValueTemplate(req.user.businessId, dto);
  }

  @Delete('value-templates/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeValueTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.variationsService.removeValueTemplate(id);
  }

  // ─── Product Variations ───────────────────────────────────────────────────

  @Post('product-variations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createProductVariation(@Body() dto: CreateProductVariationDto) {
    return this.variationsService.createProductVariation(dto);
  }

  @Get('product-variations/by-product/:productId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findProductVariations(@Param('productId', ParseIntPipe) productId: number) {
    return this.variationsService.findProductVariations(productId);
  }

  @Delete('product-variations/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeProductVariation(@Param('id', ParseIntPipe) id: number) {
    return this.variationsService.removeProductVariation(id);
  }

  // ─── Variations ───────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createVariation(@Body() dto: CreateVariationDto) {
    return this.variationsService.createVariation(dto);
  }

  @Get('by-product/:productId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findVariationsByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.variationsService.findVariationsByProduct(productId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findOneVariation(@Param('id', ParseIntPipe) id: number) {
    return this.variationsService.findOneVariation(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateVariation(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateVariationDto>) {
    return this.variationsService.updateVariation(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeVariation(@Param('id', ParseIntPipe) id: number) {
    return this.variationsService.removeVariation(id);
  }
}
