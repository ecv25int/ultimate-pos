import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLeaveTypeDto, CreateLeaveDto, UpdateLeaveStatusDto,
  CreatePayrollDto, CreateDocumentDto, CreateReminderDto,
} from './dto/essentials.dto';

@Injectable()
export class EssentialsService {
  constructor(private prisma: PrismaService) {}

  // ---- Leave Types ----
  async getLeaveTypes(businessId: number) {
    return this.prisma.essentialsLeaveType.findMany({ where: { businessId } });
  }

  async createLeaveType(businessId: number, dto: CreateLeaveTypeDto) {
    return this.prisma.essentialsLeaveType.create({ data: { ...dto, businessId } });
  }

  async deleteLeaveType(id: number, businessId: number) {
    await this.prisma.essentialsLeaveType.deleteMany({ where: { id, businessId } });
    return { success: true };
  }

  // ---- Leaves ----
  async getLeaves(businessId: number, userId?: number, status?: string) {
    return this.prisma.essentialsLeave.findMany({
      where: { businessId, ...(userId && { userId }), ...(status && { status }) },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeave(businessId: number, dto: CreateLeaveDto) {
    return this.prisma.essentialsLeave.create({
      data: {
        ...dto,
        businessId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: 'pending',
      },
    });
  }

  async updateLeaveStatus(id: number, businessId: number, dto: UpdateLeaveStatusDto) {
    const leave = await this.prisma.essentialsLeave.findFirst({ where: { id, businessId } });
    if (!leave) throw new NotFoundException('Leave not found');
    return this.prisma.essentialsLeave.update({ where: { id }, data: dto });
  }

  async deleteLeave(id: number, businessId: number) {
    await this.prisma.essentialsLeave.deleteMany({ where: { id, businessId } });
    return { success: true };
  }

  // ---- Payrolls ----
  async getPayrolls(businessId: number, userId?: number) {
    return this.prisma.essentialsPayroll.findMany({
      where: { businessId, ...(userId && { userId }) },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async createPayroll(businessId: number, userId: number, dto: CreatePayrollDto) {
    return this.prisma.essentialsPayroll.create({
      data: { ...dto, businessId, createdBy: userId },
    });
  }

  async deletePayroll(id: number, businessId: number) {
    await this.prisma.essentialsPayroll.deleteMany({ where: { id, businessId } });
    return { success: true };
  }

  // ---- Documents ----
  async getDocuments(businessId: number, userId?: number) {
    return this.prisma.essentialsDocument.findMany({
      where: { businessId, ...(userId && { userId }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(businessId: number, dto: CreateDocumentDto) {
    return this.prisma.essentialsDocument.create({ data: { ...dto, businessId } });
  }

  async deleteDocument(id: number, businessId: number) {
    await this.prisma.essentialsDocument.deleteMany({ where: { id, businessId } });
    return { success: true };
  }

  // ---- Reminders ----
  async getReminders(businessId: number, userId?: number) {
    return this.prisma.essentialsReminder.findMany({
      where: { businessId, ...(userId && { userId }) },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async createReminder(businessId: number, userId: number, dto: CreateReminderDto) {
    const [h, m, s] = dto.time.split(':').map(Number);
    const timeDate = new Date(0, 0, 0, h, m, s ?? 0);
    return this.prisma.essentialsReminder.create({
      data: {
        name: dto.name,
        date: new Date(dto.date),
        time: timeDate,
        repeat: dto.repeat,
        businessId,
        userId,
      },
    });
  }

  async deleteReminder(id: number, businessId: number) {
    await this.prisma.essentialsReminder.deleteMany({ where: { id, businessId } });
    return { success: true };
  }

  // ---- Dashboard ----
  async getDashboard(businessId: number, userId: number) {
    const [pendingLeaves, approvedLeaves, payrolls, reminders] = await Promise.all([
      this.prisma.essentialsLeave.count({ where: { businessId, status: 'pending' } }),
      this.prisma.essentialsLeave.count({ where: { businessId, userId, status: 'approved' } }),
      this.prisma.essentialsPayroll.count({ where: { businessId, userId } }),
      this.prisma.essentialsReminder.count({ where: { businessId, userId, date: { gte: new Date() } } }),
    ]);
    return { pendingLeaves, myApprovedLeaves: approvedLeaves, myPayrolls: payrolls, upcomingReminders: reminders };
  }
}
