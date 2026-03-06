import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSellingPriceGroupDto } from './dto/create-selling-price-group.dto';
import { UpdateSellingPriceGroupDto } from './dto/update-selling-price-group.dto';

@Injectable()
export class SellingPriceGroupsService {
  constructor(private prisma: PrismaService) {}

  create(businessId: number, dto: CreateSellingPriceGroupDto) {
    return this.prisma.sellingPriceGroup.create({
      data: { businessId, name: dto.name, description: dto.description, isActive: dto.isActive ?? true },
    });
  }

  findAll(businessId: number) {
    return this.prisma.sellingPriceGroup.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, businessId: number) {
    const spg = await this.prisma.sellingPriceGroup.findFirst({
      where: { id, businessId, deletedAt: null },
    });
    if (!spg) throw new NotFoundException('Selling price group not found');
    return spg;
  }

  async update(id: number, businessId: number, dto: UpdateSellingPriceGroupDto) {
    await this.findOne(id, businessId);
    return this.prisma.sellingPriceGroup.update({ where: { id }, data: dto });
  }

  async remove(id: number, businessId: number) {
    await this.findOne(id, businessId);
    return this.prisma.sellingPriceGroup.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
