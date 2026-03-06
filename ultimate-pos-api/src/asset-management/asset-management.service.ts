import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssetDto,
  UpdateAssetDto,
  CreateAssetTransactionDto,
  CreateMaintenanceDto,
  CreateWarrantyDto,
} from './dto/asset.dto';

@Injectable()
export class AssetManagementService {
  constructor(private prisma: PrismaService) {}

  // ─── Assets ────────────────────────────────────────────────────────────────

  async getAssets(businessId: number) {
    return this.prisma.asset.findMany({
      where: { businessId },
      include: {
        warranties: true,
        _count: { select: { transactions: true, maintenances: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAsset(businessId: number, id: number) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, businessId },
      include: {
        transactions: { orderBy: { transactionDatetime: 'desc' } },
        warranties: { orderBy: { startDate: 'asc' } },
        maintenances: { orderBy: { id: 'desc' } },
      },
    });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async createAsset(businessId: number, userId: number, dto: CreateAssetDto) {
    return this.prisma.asset.create({
      data: {
        businessId,
        assetCode: dto.assetCode,
        name: dto.name,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        model: dto.model ?? null,
        serialNo: dto.serialNo ?? null,
        categoryId: dto.categoryId ?? null,
        locationId: dto.locationId ?? null,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchaseType: dto.purchaseType ?? null,
        depreciation: dto.depreciation ?? null,
        isAllocatable: dto.isAllocatable ?? false,
        description: dto.description ?? null,
        createdBy: userId,
      },
    });
  }

  async updateAsset(businessId: number, id: number, dto: UpdateAssetDto) {
    await this.ensureAsset(businessId, id);
    return this.prisma.asset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
        ...(dto.isAllocatable !== undefined && { isAllocatable: dto.isAllocatable }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteAsset(businessId: number, id: number) {
    await this.ensureAsset(businessId, id);
    await this.prisma.asset.delete({ where: { id } });
    return { success: true };
  }

  private async ensureAsset(businessId: number, id: number) {
    const a = await this.prisma.asset.findFirst({ where: { id, businessId } });
    if (!a) throw new NotFoundException(`Asset ${id} not found`);
    return a;
  }

  // ─── Transactions ──────────────────────────────────────────────────────────

  async getTransactions(businessId: number, assetId?: number) {
    return this.prisma.assetTransaction.findMany({
      where: { businessId, ...(assetId ? { assetId } : {}) },
      include: { asset: { select: { id: true, name: true, assetCode: true } } },
      orderBy: { transactionDatetime: 'desc' },
    });
  }

  async createTransaction(businessId: number, userId: number, dto: CreateAssetTransactionDto) {
    await this.ensureAsset(businessId, dto.assetId);
    const count = await this.prisma.assetTransaction.count({ where: { businessId } });
    return this.prisma.assetTransaction.create({
      data: {
        businessId,
        assetId: dto.assetId,
        transactionType: dto.transactionType,
        refNo: dto.refNo || `AT-${count + 1}`,
        quantity: dto.quantity,
        transactionDatetime: new Date(dto.transactionDatetime),
        receiver: dto.receiver ?? null,
        allocatedUpto: dto.allocatedUpto ? new Date(dto.allocatedUpto) : null,
        reason: dto.reason ?? null,
        createdBy: userId,
      },
    });
  }

  // ─── Warranties ────────────────────────────────────────────────────────────

  async createWarranty(businessId: number, dto: CreateWarrantyDto) {
    await this.ensureAsset(businessId, dto.assetId);
    return this.prisma.assetWarranty.create({
      data: {
        assetId: dto.assetId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        additionalCost: dto.additionalCost ?? 0,
        additionalNote: dto.additionalNote ?? null,
      },
    });
  }

  async deleteWarranty(id: number) {
    const w = await this.prisma.assetWarranty.findUnique({ where: { id } });
    if (!w) throw new NotFoundException(`Warranty ${id} not found`);
    await this.prisma.assetWarranty.delete({ where: { id } });
    return { success: true };
  }

  // ─── Maintenances ──────────────────────────────────────────────────────────

  async getMaintenances(businessId: number, assetId?: number) {
    return this.prisma.assetMaintenance.findMany({
      where: { businessId, ...(assetId ? { assetId } : {}) },
      include: { asset: { select: { id: true, name: true } } },
      orderBy: { id: 'desc' },
    });
  }

  async createMaintenance(businessId: number, userId: number, dto: CreateMaintenanceDto) {
    await this.ensureAsset(businessId, dto.assetId);
    return this.prisma.assetMaintenance.create({
      data: {
        businessId,
        assetId: dto.assetId,
        maitenanceId: dto.maitenanceId ?? null,
        status: dto.status ?? 'pending',
        priority: dto.priority ?? null,
        assignedTo: dto.assignedTo ?? null,
        details: dto.details ?? null,
        createdBy: userId,
      },
    });
  }

  async updateMaintenance(businessId: number, id: bigint, status: string) {
    const m = await this.prisma.assetMaintenance.findFirst({ where: { id, businessId } });
    if (!m) throw new NotFoundException(`Maintenance record not found`);
    return this.prisma.assetMaintenance.update({ where: { id }, data: { status } });
  }

  async deleteMaintenance(businessId: number, id: bigint) {
    const m = await this.prisma.assetMaintenance.findFirst({ where: { id, businessId } });
    if (!m) throw new NotFoundException(`Maintenance record not found`);
    await this.prisma.assetMaintenance.delete({ where: { id } });
    return { success: true };
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(businessId: number) {
    const [totalAssets, allocatedCount, maintenancePending] = await Promise.all([
      this.prisma.asset.count({ where: { businessId } }),
      this.prisma.asset.count({ where: { businessId, isAllocatable: true } }),
      this.prisma.assetMaintenance.count({ where: { businessId, status: 'pending' } }),
    ]);

    // expiring warranties in next 30 days
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const expiringWarranties = await this.prisma.assetWarranty.count({
      where: {
        asset: { businessId },
        endDate: { gte: new Date(), lte: soon },
      },
    });

    return { totalAssets, allocatedCount, maintenancePending, expiringWarranties };
  }
}
