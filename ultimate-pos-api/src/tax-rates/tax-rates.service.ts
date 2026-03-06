import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { SetGroupSubTaxesDto } from './dto/set-group-sub-taxes.dto';

@Injectable()
export class TaxRatesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: number, userId: number, dto: CreateTaxRateDto) {
    // If setting as default, unset any existing default first
    if (dto.isDefault) {
      await this.prisma.taxRate.updateMany({
        where: { businessId, isDefault: true, deletedAt: null },
        data: { isDefault: false },
      });
    }

    return this.prisma.taxRate.create({
      data: {
        businessId,
        name: dto.name,
        rate: dto.rate,
        type: dto.type ?? 'percentage',
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
        createdBy: userId,
      },
    });
  }

  async findAll(businessId: number, includeInactive = false) {
    return this.prisma.taxRate.findMany({
      where: {
        businessId,
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(businessId: number, id: number) {
    const taxRate = await this.prisma.taxRate.findFirst({
      where: { id, businessId, deletedAt: null },
    });
    if (!taxRate) throw new NotFoundException('Tax rate not found');
    return taxRate;
  }

  async update(
    businessId: number,
    id: number,
    dto: UpdateTaxRateDto,
  ) {
    await this.findOne(businessId, id);

    // If setting as default, unset others
    if (dto.isDefault) {
      await this.prisma.taxRate.updateMany({
        where: { businessId, isDefault: true, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.taxRate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.rate !== undefined ? { rate: dto.rate } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(businessId: number, id: number) {
    await this.findOne(businessId, id);
    return this.prisma.taxRate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Group Sub-Tax Methods ───────────────────────────────────────────────────

  /** Return a tax rate with its sub-taxes populated */
  async getWithSubTaxes(businessId: number, id: number) {
    const taxRate = await this.prisma.taxRate.findFirst({
      where: { id, businessId, deletedAt: null },
      include: {
        groupSubTaxesAsGroup: {
          include: { subTax: true },
        },
      },
    });
    if (!taxRate) throw new NotFoundException('Tax rate not found');
    return taxRate;
  }

  /** Get sub-taxes for a group tax rate */
  async getSubTaxes(businessId: number, groupTaxId: number) {
    await this.findOne(businessId, groupTaxId);
    const rows = await this.prisma.groupSubTax.findMany({
      where: { groupTaxId },
      include: { subTax: true },
    });
    return rows.map((r) => r.subTax);
  }

  /** Replace all sub-taxes for a group tax rate */
  async setSubTaxes(
    businessId: number,
    groupTaxId: number,
    dto: SetGroupSubTaxesDto,
  ) {
    await this.findOne(businessId, groupTaxId);

    // Delete existing pivot rows then re-create
    await this.prisma.groupSubTax.deleteMany({ where: { groupTaxId } });

    if (dto.taxIds.length > 0) {
      await this.prisma.groupSubTax.createMany({
        data: dto.taxIds.map((taxId) => ({ groupTaxId, taxId })),
        skipDuplicates: true,
      });
    }

    return this.getSubTaxes(businessId, groupTaxId);
  }

  /** Add a single sub-tax to a group tax rate */
  async addSubTax(businessId: number, groupTaxId: number, taxId: number) {
    await this.findOne(businessId, groupTaxId);
    await this.findOne(businessId, taxId);

    await this.prisma.groupSubTax.upsert({
      where: { groupTaxId_taxId: { groupTaxId, taxId } },
      create: { groupTaxId, taxId },
      update: {},
    });

    return this.getSubTaxes(businessId, groupTaxId);
  }

  /** Remove a single sub-tax from a group tax rate */
  async removeSubTax(businessId: number, groupTaxId: number, taxId: number) {
    await this.findOne(businessId, groupTaxId);
    await this.prisma.groupSubTax.deleteMany({ where: { groupTaxId, taxId } });
    return this.getSubTaxes(businessId, groupTaxId);
  }
}
