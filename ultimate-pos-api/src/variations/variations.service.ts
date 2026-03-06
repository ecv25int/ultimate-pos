import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVariationTemplateDto } from './dto/create-variation-template.dto';
import { UpdateVariationTemplateDto } from './dto/update-variation-template.dto';
import { CreateVariationValueTemplateDto } from './dto/create-variation-value-template.dto';
import { CreateProductVariationDto } from './dto/create-product-variation.dto';
import { CreateVariationDto } from './dto/create-variation.dto';

@Injectable()
export class VariationsService {
  constructor(private prisma: PrismaService) {}

  // ─── Variation Templates ───────────────────────────────────────────────────

  createTemplate(businessId: number, dto: CreateVariationTemplateDto) {
    return this.prisma.variationTemplate.create({
      data: { businessId, name: dto.name },
      include: { variationValues: true },
    });
  }

  findAllTemplates(businessId: number) {
    return this.prisma.variationTemplate.findMany({
      where: { businessId },
      include: { variationValues: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOneTemplate(id: number, businessId: number) {
    const tpl = await this.prisma.variationTemplate.findFirst({
      where: { id, businessId },
      include: { variationValues: true },
    });
    if (!tpl) throw new NotFoundException('Variation template not found');
    return tpl;
  }

  async updateTemplate(id: number, businessId: number, dto: UpdateVariationTemplateDto) {
    await this.findOneTemplate(id, businessId);
    return this.prisma.variationTemplate.update({ where: { id }, data: dto });
  }

  async removeTemplate(id: number, businessId: number) {
    await this.findOneTemplate(id, businessId);
    return this.prisma.variationTemplate.delete({ where: { id } });
  }

  // ─── Variation Value Templates ─────────────────────────────────────────────

  createValueTemplate(businessId: number, dto: CreateVariationValueTemplateDto) {
    return this.prisma.variationValueTemplate.create({
      data: { variationTemplateId: dto.variationTemplateId, name: dto.name },
    });
  }

  async removeValueTemplate(id: number) {
    const vvt = await this.prisma.variationValueTemplate.findUnique({ where: { id } });
    if (!vvt) throw new NotFoundException('Variation value template not found');
    return this.prisma.variationValueTemplate.delete({ where: { id } });
  }

  // ─── Product Variations ────────────────────────────────────────────────────

  createProductVariation(dto: CreateProductVariationDto) {
    return this.prisma.productVariation.create({
      data: {
        productId: dto.productId,
        name: dto.name,
        isDummy: dto.isDummy ?? true,
      },
      include: { variations: true },
    });
  }

  findProductVariations(productId: number) {
    return this.prisma.productVariation.findMany({
      where: { productId },
      include: { variations: true },
    });
  }

  async removeProductVariation(id: number) {
    const pv = await this.prisma.productVariation.findUnique({ where: { id } });
    if (!pv) throw new NotFoundException('Product variation not found');
    return this.prisma.productVariation.delete({ where: { id } });
  }

  // ─── Variations ────────────────────────────────────────────────────────────

  createVariation(dto: CreateVariationDto) {
    return this.prisma.variation.create({
      data: {
        productId: dto.productId,
        productVariationId: dto.productVariationId,
        name: dto.name,
        subSku: dto.subSku,
        defaultPurchasePrice: dto.defaultPurchasePrice,
        dppIncTax: dto.dppIncTax ?? 0,
        profitPercent: dto.profitPercent ?? 0,
        defaultSellPrice: dto.defaultSellPrice,
        sellPriceIncTax: dto.sellPriceIncTax,
      },
    });
  }

  findVariationsByProduct(productId: number) {
    return this.prisma.variation.findMany({
      where: { productId, deletedAt: null },
      include: { productVariation: true, groupPrices: true, locationDetails: true },
    });
  }

  async findOneVariation(id: number) {
    const v = await this.prisma.variation.findFirst({
      where: { id, deletedAt: null },
      include: { productVariation: true, groupPrices: true, locationDetails: true },
    });
    if (!v) throw new NotFoundException('Variation not found');
    return v;
  }

  async updateVariation(id: number, dto: Partial<CreateVariationDto>) {
    await this.findOneVariation(id);
    return this.prisma.variation.update({ where: { id }, data: dto });
  }

  async removeVariation(id: number) {
    await this.findOneVariation(id);
    return this.prisma.variation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
