import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  /** Fire-and-forget audit log entry. Never throws. */
  log(
    businessId: number,
    userId: number | null,
    action: AuditAction,
    entity: string,
    entityId?: number | null,
    meta?: Record<string, any> | null,
    ip?: string | null,
  ): void {
    this.prisma.auditLog
      .create({
        data: {
          businessId,
          userId: userId ?? null,
          action,
          entity,
          entityId: entityId ?? null,
          meta: meta ?? undefined,
          ip: ip ?? null,
        },
      })
      .catch(() => {
        // Audit log failures are non-fatal
      });
  }

  async findAll(
    businessId: number,
    opts: {
      entity?: string;
      action?: string;
      userId?: number;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { entity, action, userId, page = 1, limit = 30 } = opts;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          businessId: true,
          userId: true,
          action: true,
          entity: true,
          entityId: true,
          meta: true,
          ip: true,
          createdAt: true,
        },
      }),
    ]);

    return { total, page, limit, totalPages: Math.ceil(total / limit), data };
  }
}
