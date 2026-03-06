import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto, UpdatePackageDto, CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './dto/superadmin.dto';

@Injectable()
export class SuperadminService {
  constructor(private prisma: PrismaService) {}

  // ---- Packages ----
  async getPackages() {
    return this.prisma.package.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPackage(id: number) {
    const pkg = await this.prisma.package.findFirst({ where: { id, deletedAt: null } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async createPackage(userId: number, dto: CreatePackageDto) {
    return this.prisma.package.create({ data: { ...dto, createdBy: userId } });
  }

  async updatePackage(id: number, dto: UpdatePackageDto) {
    await this.getPackage(id);
    return this.prisma.package.update({ where: { id }, data: dto });
  }

  async deletePackage(id: number) {
    await this.getPackage(id);
    await this.prisma.package.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ---- Subscriptions ----
  async getSubscriptions(businessId?: number) {
    return this.prisma.subscription.findMany({
      where: { deletedAt: null, ...(businessId && { businessId }) },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscription(id: number) {
    const sub = await this.prisma.subscription.findFirst({ where: { id, deletedAt: null }, include: { package: true } });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async createSubscription(userId: number, dto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: {
        ...dto,
        createdId: userId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        trialEndDate: dto.trialEndDate ? new Date(dto.trialEndDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: 'waiting',
      },
    });
  }

  async updateSubscriptionStatus(id: number, dto: UpdateSubscriptionStatusDto) {
    await this.getSubscription(id);
    return this.prisma.subscription.update({ where: { id }, data: { status: dto.status } });
  }

  async deleteSubscription(id: number) {
    await this.getSubscription(id);
    await this.prisma.subscription.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ---- Dashboard ----
  async getDashboard() {
    const now = new Date();
    const [totalPackages, activeSubscriptions, pendingSubscriptions, expiring] = await Promise.all([
      this.prisma.package.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.subscription.count({ where: { deletedAt: null, status: 'approved', endDate: { gte: now } } }),
      this.prisma.subscription.count({ where: { deletedAt: null, status: 'waiting' } }),
      this.prisma.subscription.count({
        where: { deletedAt: null, status: 'approved', endDate: { gte: now, lte: new Date(now.getTime() + 30 * 86400000) } },
      }),
    ]);
    return { totalPackages, activeSubscriptions, pendingSubscriptions, expiringIn30Days: expiring };
  }
}
