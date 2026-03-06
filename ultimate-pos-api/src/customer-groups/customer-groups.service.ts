import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';

@Injectable()
export class CustomerGroupsService {
  constructor(private prisma: PrismaService) {}

  create(userId: number, businessId: number, dto: CreateCustomerGroupDto) {
    return this.prisma.customerGroup.create({
      data: {
        businessId,
        name: dto.name,
        amount: dto.amount ?? 0,
        createdBy: userId,
      },
    });
  }

  findAll(businessId: number) {
    return this.prisma.customerGroup.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, businessId: number) {
    const group = await this.prisma.customerGroup.findFirst({ where: { id, businessId } });
    if (!group) throw new NotFoundException('Customer group not found');
    return group;
  }

  async update(id: number, businessId: number, dto: UpdateCustomerGroupDto) {
    await this.findOne(id, businessId);
    return this.prisma.customerGroup.update({ where: { id }, data: dto });
  }

  async remove(id: number, businessId: number) {
    await this.findOne(id, businessId);
    return this.prisma.customerGroup.delete({ where: { id } });
  }
}
