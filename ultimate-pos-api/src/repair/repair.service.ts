import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRepairStatusDto,
  CreateDeviceModelDto,
  CreateJobSheetDto,
  UpdateJobSheetDto,
} from './dto/repair.dto';

@Injectable()
export class RepairService {
  constructor(private prisma: PrismaService) {}

  // ─── Statuses ──────────────────────────────────────────────────────────────

  async getStatuses(businessId: number) {
    return this.prisma.repairStatus.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createStatus(businessId: number, dto: CreateRepairStatusDto) {
    return this.prisma.repairStatus.create({
      data: {
        businessId,
        name: dto.name,
        color: dto.color ?? null,
        sortOrder: dto.sortOrder ?? null,
      },
    });
  }

  async deleteStatus(businessId: number, id: number) {
    const s = await this.prisma.repairStatus.findFirst({ where: { id, businessId } });
    if (!s) throw new NotFoundException(`Status ${id} not found`);
    await this.prisma.repairStatus.delete({ where: { id } });
    return { success: true };
  }

  // ─── Device Models ─────────────────────────────────────────────────────────

  async getDeviceModels(businessId: number) {
    return this.prisma.repairDeviceModel.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
  }

  async createDeviceModel(businessId: number, userId: number, dto: CreateDeviceModelDto) {
    return this.prisma.repairDeviceModel.create({
      data: {
        businessId,
        name: dto.name,
        repairChecklist: dto.repairChecklist ?? null,
        brandId: dto.brandId ?? null,
        deviceId: dto.deviceId ?? null,
        createdBy: userId,
      },
    });
  }

  async deleteDeviceModel(businessId: number, id: number) {
    const dm = await this.prisma.repairDeviceModel.findFirst({ where: { id, businessId } });
    if (!dm) throw new NotFoundException(`Device model ${id} not found`);
    await this.prisma.repairDeviceModel.delete({ where: { id } });
    return { success: true };
  }

  // ─── Job Sheets ────────────────────────────────────────────────────────────

  async getJobSheets(businessId: number, filters: { statusId?: number; contactId?: number }) {
    const where: Record<string, unknown> = { businessId };
    if (filters.statusId) where['statusId'] = filters.statusId;
    if (filters.contactId) where['contactId'] = filters.contactId;
    return this.prisma.repairJobSheet.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, mobile: true } },
        status: { select: { id: true, name: true, color: true } },
        deviceModel: { select: { id: true, name: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  async getJobSheet(businessId: number, id: number) {
    const js = await this.prisma.repairJobSheet.findFirst({
      where: { id, businessId },
      include: {
        contact: { select: { id: true, name: true, mobile: true } },
        status: true,
        deviceModel: true,
      },
    });
    if (!js) throw new NotFoundException(`Job sheet ${id} not found`);
    return js;
  }

  async createJobSheet(businessId: number, userId: number, dto: CreateJobSheetDto) {
    return this.prisma.repairJobSheet.create({
      data: {
        businessId,
        locationId: dto.locationId ?? null,
        contactId: dto.contactId,
        jobSheetNo: dto.jobSheetNo,
        serviceType: dto.serviceType ?? 'carry_in',
        pickUpOnSiteAddr: dto.pickUpOnSiteAddr ?? null,
        brandId: dto.brandId ?? null,
        deviceId: dto.deviceId ?? null,
        deviceModelId: dto.deviceModelId ?? null,
        checklist: dto.checklist ?? null,
        securityPwd: dto.securityPwd ?? null,
        securityPattern: dto.securityPattern ?? null,
        serialNo: dto.serialNo,
        statusId: dto.statusId,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        defects: dto.defects ?? null,
        productCondition: dto.productCondition ?? null,
        serviceStaff: dto.serviceStaff ?? null,
        commentBySs: dto.commentBySs ?? null,
        estimatedCost: dto.estimatedCost ?? null,
        parts: dto.parts ?? null,
        createdBy: userId,
      },
    });
  }

  async updateJobSheet(businessId: number, id: number, dto: UpdateJobSheetDto) {
    const js = await this.prisma.repairJobSheet.findFirst({ where: { id, businessId } });
    if (!js) throw new NotFoundException(`Job sheet ${id} not found`);
    return this.prisma.repairJobSheet.update({
      where: { id },
      data: {
        ...(dto.statusId !== undefined && { statusId: dto.statusId }),
        ...(dto.commentBySs !== undefined && { commentBySs: dto.commentBySs }),
        ...(dto.estimatedCost !== undefined && { estimatedCost: dto.estimatedCost }),
        ...(dto.deliveryDate !== undefined && { deliveryDate: new Date(dto.deliveryDate) }),
        ...(dto.serviceStaff !== undefined && { serviceStaff: dto.serviceStaff }),
        ...(dto.parts !== undefined && { parts: dto.parts }),
      },
    });
  }

  async deleteJobSheet(businessId: number, id: number) {
    const js = await this.prisma.repairJobSheet.findFirst({ where: { id, businessId } });
    if (!js) throw new NotFoundException(`Job sheet ${id} not found`);
    await this.prisma.repairJobSheet.delete({ where: { id } });
    return { success: true };
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(businessId: number) {
    const statuses = await this.prisma.repairStatus.findMany({ where: { businessId } });
    const statusCounts = await Promise.all(
      statuses.map(async (s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        count: await this.prisma.repairJobSheet.count({
          where: { businessId, statusId: s.id },
        }),
      })),
    );
    const totalJobSheets = await this.prisma.repairJobSheet.count({ where: { businessId } });
    return { totalJobSheets, statusBreakdown: statusCounts };
  }
}
