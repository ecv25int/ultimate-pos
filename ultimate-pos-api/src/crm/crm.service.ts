import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, CreateScheduleDto, UpdateScheduleDto, CreateCallLogDto } from './dto/crm.dto';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  // ─── Campaigns ─────────────────────────────────────────────────────────────

  async getCampaigns(businessId: number) {
    return this.prisma.crmCampaign.findMany({
      where: { businessId },
      orderBy: { id: 'desc' },
    });
  }

  async createCampaign(businessId: number, userId: number, dto: CreateCampaignDto) {
    const contactIds = Array.isArray(dto.contactIds)
      ? JSON.stringify(dto.contactIds)
      : dto.contactIds;
    return this.prisma.crmCampaign.create({
      data: {
        businessId,
        name: dto.name,
        campaignType: dto.campaignType,
        subject: dto.subject ?? null,
        emailBody: dto.emailBody ?? null,
        smsBody: dto.smsBody ?? null,
        contactIds,
        status: 'draft',
        createdBy: userId,
      },
    });
  }

  async updateCampaignStatus(businessId: number, id: number, status: string) {
    await this.ensureCampaign(businessId, id);
    return this.prisma.crmCampaign.update({
      where: { id },
      data: { status, ...(status === 'sent' && { sentOn: new Date() }) },
    });
  }

  async deleteCampaign(businessId: number, id: number) {
    await this.ensureCampaign(businessId, id);
    await this.prisma.crmCampaign.delete({ where: { id } });
    return { success: true };
  }

  private async ensureCampaign(businessId: number, id: number) {
    const c = await this.prisma.crmCampaign.findFirst({ where: { id, businessId } });
    if (!c) throw new NotFoundException(`Campaign ${id} not found`);
    return c;
  }

  // ─── Schedules ─────────────────────────────────────────────────────────────

  async getSchedules(businessId: number, filters: { contactId?: number; status?: string; type?: string }) {
    const where: Record<string, unknown> = { businessId };
    if (filters.contactId) where['contactId'] = filters.contactId;
    if (filters.status) where['status'] = filters.status;
    if (filters.type) where['scheduleType'] = filters.type;
    return this.prisma.crmSchedule.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, mobile: true } },
      },
      orderBy: { startDatetime: 'asc' },
    });
  }

  async createSchedule(businessId: number, userId: number, dto: CreateScheduleDto) {
    return this.prisma.crmSchedule.create({
      data: {
        businessId,
        contactId: dto.contactId,
        title: dto.title,
        scheduleType: dto.scheduleType,
        startDatetime: new Date(dto.startDatetime),
        endDatetime: new Date(dto.endDatetime),
        description: dto.description ?? null,
        status: 'pending',
        createdBy: userId,
      },
    });
  }

  async updateSchedule(businessId: number, id: number, dto: UpdateScheduleDto) {
    const s = await this.prisma.crmSchedule.findFirst({ where: { id, businessId } });
    if (!s) throw new NotFoundException(`Schedule ${id} not found`);
    return this.prisma.crmSchedule.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.scheduleType !== undefined && { scheduleType: dto.scheduleType }),
        ...(dto.startDatetime !== undefined && { startDatetime: new Date(dto.startDatetime) }),
        ...(dto.endDatetime !== undefined && { endDatetime: new Date(dto.endDatetime) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async deleteSchedule(businessId: number, id: number) {
    const s = await this.prisma.crmSchedule.findFirst({ where: { id, businessId } });
    if (!s) throw new NotFoundException(`Schedule ${id} not found`);
    await this.prisma.crmSchedule.delete({ where: { id } });
    return { success: true };
  }

  // ─── Call Logs ─────────────────────────────────────────────────────────────

  async getCallLogs(businessId: number, filters: { contactId?: number; page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where: Record<string, unknown> = { businessId };
    if (filters.contactId) where['contactId'] = filters.contactId;
    const [items, total] = await Promise.all([
      this.prisma.crmCallLog.findMany({
        where,
        include: {
          contact: { select: { id: true, name: true } },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.crmCallLog.count({ where }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createCallLog(businessId: number, userId: number, dto: CreateCallLogDto) {
    return this.prisma.crmCallLog.create({
      data: {
        businessId,
        contactId: dto.contactId ?? null,
        userId,
        callType: dto.callType,
        mobileNumber: dto.mobileNumber,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        duration: dto.duration ?? null,
        note: dto.note ?? null,
        createdBy: userId,
      },
    });
  }

  async deleteCallLog(businessId: number, id: number) {
    const log = await this.prisma.crmCallLog.findFirst({ where: { id, businessId } });
    if (!log) throw new NotFoundException(`Call log ${id} not found`);
    await this.prisma.crmCallLog.delete({ where: { id } });
    return { success: true };
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(businessId: number) {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [upcomingSchedules, pendingCount, completedToday, recentCalls] = await Promise.all([
      this.prisma.crmSchedule.findMany({
        where: { businessId, status: 'pending', startDatetime: { gte: now, lt: weekEnd } },
        include: { contact: { select: { id: true, name: true } } },
        orderBy: { startDatetime: 'asc' },
        take: 5,
      }),
      this.prisma.crmSchedule.count({ where: { businessId, status: 'pending' } }),
      this.prisma.crmSchedule.count({
        where: {
          businessId,
          status: 'completed',
          endDatetime: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.crmCallLog.findMany({
        where: { businessId },
        include: { contact: { select: { id: true, name: true } } },
        orderBy: { id: 'desc' },
        take: 5,
      }),
    ]);

    return { upcomingSchedules, pendingCount, completedToday, recentCalls };
  }
}
