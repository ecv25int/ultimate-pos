import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, businessId: number, createBrandDto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        name: createBrandDto.name,
        description: createBrandDto.description,
        businessId,
        createdBy: userId,
      },
    });
  }

  async findAll(businessId: number) {
    return this.prisma.brand.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number, businessId: number) {
    const brand = await this.prisma.brand.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async update(id: number, businessId: number, updateBrandDto: UpdateBrandDto) {
    // Verify brand exists and belongs to the user's business
    const brand = await this.prisma.brand.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        name: updateBrandDto.name,
        description: updateBrandDto.description,
      },
    });
  }

  async remove(id: number, businessId: number) {
    // Verify brand exists and belongs to the user's business
    const brand = await this.prisma.brand.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Soft delete
    await this.prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Brand deleted successfully' };
  }
}
