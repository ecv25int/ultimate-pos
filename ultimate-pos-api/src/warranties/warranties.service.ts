import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';

@Injectable()
export class WarrantiesService {
  constructor(private prisma: PrismaService) {}

  create(businessId: number, dto: CreateWarrantyDto) {
    return this.prisma.warranty.create({
      data: {
        businessId,
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        durationType: dto.durationType as any,
      },
    });
  }

  findAll(businessId: number) {
    return this.prisma.warranty.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, businessId: number) {
    const w = await this.prisma.warranty.findFirst({ where: { id, businessId } });
    if (!w) throw new NotFoundException('Warranty not found');
    return w;
  }

  async update(id: number, businessId: number, dto: UpdateWarrantyDto) {
    await this.findOne(id, businessId);
    return this.prisma.warranty.update({ where: { id }, data: dto as any });
  }

  async remove(id: number, businessId: number) {
    await this.findOne(id, businessId);
    return this.prisma.warranty.delete({ where: { id } });
  }
}
