import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChangeUserPasswordDto,
  CreateUserDto,
  UpdateUserDto,
} from './dto/user.dto';

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  userType: true,
  businessId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    businessId: number,
    opts: { page?: number; limit?: number; search?: string; userType?: string },
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (opts.search) {
      where.OR = [
        { username: { contains: opts.search } },
        { email: { contains: opts.search } },
        { firstName: { contains: opts.search } },
        { lastName: { contains: opts.search } },
      ];
    }
    if (opts.userType) where.userType = opts.userType;

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(businessId: number, id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, businessId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(businessId: number, dto: CreateUserDto) {
    // Check username unique
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username already exists');

    if (dto.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) throw new ConflictException('Email already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashed,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        userType: dto.userType ?? 'user',
        businessId,
        isActive: true,
      },
      select: USER_SELECT,
    });
  }

  async update(businessId: number, id: number, dto: UpdateUserDto) {
    await this.findOne(businessId, id);

    if (dto.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (emailExists) throw new ConflictException('Email already exists');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.userType !== undefined ? { userType: dto.userType } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      select: USER_SELECT,
    });
  }

  async changePassword(
    businessId: number,
    id: number,
    dto: ChangeUserPasswordDto,
  ) {
    await this.findOne(businessId, id);
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
    return { message: 'Password updated successfully' };
  }

  async toggleActive(businessId: number, id: number, requesterId: number) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }
    const user = await this.findOne(businessId, id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: USER_SELECT,
    });
  }

  async remove(businessId: number, id: number, requesterId: number) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    const user = await this.findOne(businessId, id);
    if (user.userType === 'admin') {
      // Prevent deleting the last admin
      const adminCount = await this.prisma.user.count({
        where: { businessId, userType: 'admin', isActive: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last active admin');
      }
    }
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  async getSummary(businessId: number) {
    const [total, active, byType] = await Promise.all([
      this.prisma.user.count({ where: { businessId } }),
      this.prisma.user.count({ where: { businessId, isActive: true } }),
      this.prisma.user.groupBy({
        by: ['userType'],
        where: { businessId },
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byType: byType.map((b) => ({ type: b.userType, count: b._count })),
    };
  }
}
