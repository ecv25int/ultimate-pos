import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CreateBusinessLocationDto } from './dto/create-business-location.dto';
import { UpdateBusinessLocationDto } from './dto/update-business-location.dto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(createBusinessDto: CreateBusinessDto, userId: number) {
    const business = await this.prisma.business.create({
      data: {
        ...createBusinessDto,
      },
    });

    // Assign the creating user to this business
    await this.prisma.user.update({
      where: { id: userId },
      data: { businessId: business.id },
    });

    return business;
  }

  async findAll() {
    return this.prisma.business.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            userType: true,
            isActive: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto, userId: number) {
    // Check if business exists
    const business = await this.findOne(id);

    // Check if user belongs to this business or is an admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.userType !== 'admin' && user?.businessId !== id) {
      throw new ForbiddenException('You do not have permission to update this business');
    }

    return this.prisma.business.update({
      where: { id },
      data: updateBusinessDto,
    });
  }

  async remove(id: number, userId: number) {
    // Check if business exists
    await this.findOne(id);

    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.userType !== 'admin') {
      throw new ForbiddenException('Only admins can delete businesses');
    }

    // Soft delete by setting isActive to false
    return this.prisma.business.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getMyBusiness(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user?.business) {
      throw new NotFoundException('You are not assigned to any business');
    }

    return user.business;
  }

  // ─── Business Locations ─────────────────────────────────────────────────────

  async getLocations(businessId: number) {
    return this.prisma.businessLocation.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getLocation(id: number, businessId: number) {
    const location = await this.prisma.businessLocation.findFirst({
      where: { id, businessId },
    });
    if (!location) throw new NotFoundException(`Location #${id} not found`);
    return location;
  }

  async createLocation(businessId: number, dto: CreateBusinessLocationDto) {
    return this.prisma.businessLocation.create({
      data: { ...dto, businessId },
    });
  }

  async updateLocation(id: number, businessId: number, dto: UpdateBusinessLocationDto) {
    await this.getLocation(id, businessId);
    return this.prisma.businessLocation.update({
      where: { id },
      data: dto,
    });
  }

  async removeLocation(id: number, businessId: number) {
    await this.getLocation(id, businessId);
    return this.prisma.businessLocation.delete({ where: { id } });
  }
}

