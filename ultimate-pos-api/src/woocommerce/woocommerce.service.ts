import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSyncLogDto } from './dto/woocommerce.dto';

@Injectable()
export class WoocommerceService {
  constructor(private prisma: PrismaService) {}

  async getSyncLogs(businessId: number, syncType?: string) {
    return this.prisma.woocommerceSyncLog.findMany({
      where: { businessId, ...(syncType && { syncType }) },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createSyncLog(businessId: number, userId: number, dto: CreateSyncLogDto) {
    return this.prisma.woocommerceSyncLog.create({
      data: { ...dto, businessId, createdBy: userId },
    });
  }

  async clearSyncLogs(businessId: number) {
    await this.prisma.woocommerceSyncLog.deleteMany({ where: { businessId } });
    return { success: true };
  }

  async getStats(businessId: number) {
    const [total, created, updated] = await Promise.all([
      this.prisma.woocommerceSyncLog.count({ where: { businessId } }),
      this.prisma.woocommerceSyncLog.count({ where: { businessId, operationType: 'created' } }),
      this.prisma.woocommerceSyncLog.count({ where: { businessId, operationType: 'updated' } }),
    ]);
    return { totalLogs: total, created, updated };
  }
}
