import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  create(businessId: number, dto: CreateDiscountDto) {
    return this.prisma.discount.create({
      data: {
        businessId,
        name: dto.name,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        locationId: dto.locationId,
        priority: dto.priority,
        discountType: dto.discountType,
        discountAmount: dto.discountAmount ?? 0,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        isActive: dto.isActive ?? true,
        applicableInSpg: dto.applicableInSpg ?? false,
        applicableInCg: dto.applicableInCg ?? false,
      },
    });
  }

  findAll(businessId: number) {
    return this.prisma.discount.findMany({
      where: { businessId },
      include: { location: true },
      orderBy: { priority: 'asc' },
    });
  }

  async findOne(id: number, businessId: number) {
    const d = await this.prisma.discount.findFirst({
      where: { id, businessId },
      include: { location: true },
    });
    if (!d) throw new NotFoundException('Discount not found');
    return d;
  }

  async update(id: number, businessId: number, dto: UpdateDiscountDto) {
    await this.findOne(id, businessId);
    const { startsAt, endsAt, ...rest } = dto;
    return this.prisma.discount.update({
      where: { id },
      data: {
        ...rest,
        ...(startsAt !== undefined && { startsAt: new Date(startsAt!) }),
        ...(endsAt !== undefined && { endsAt: new Date(endsAt!) }),
      },
    });
  }

  async remove(id: number, businessId: number) {
    await this.findOne(id, businessId);
    return this.prisma.discount.delete({ where: { id } });
  }
}
