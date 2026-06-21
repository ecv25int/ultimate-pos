import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class DiscountsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  create(businessId: number, dto: CreateDiscountDto) {
    return this.prisma.discount.create({
      data: {
        businessId,
        name: dto.name,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        locationId: dto.locationId,
        priority: dto.priority,
        discountType: dto.discountType,
        discountAmount: dto.discountAmount ?? 0,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        isActive: dto.isActive ?? true,
        applicableInSpg: dto.applicableInSpg ?? false,
        applicableInCg: dto.applicableInCg ?? false,
      },
    });
  }

  findAll(businessId: number) {
    return this.prisma.discount.findMany({
      where: { businessId },
      include: { location: true },
      orderBy: { priority: 'asc' },
    });
  }

  async findOne(id: number, businessId: number) {
    const d = await this.prisma.discount.findFirst({
      where: { id, businessId },
      include: { location: true },
    });
    if (!d) throw new NotFoundException('Discount not found');
    return d;
  }

  async update(id: number, businessId: number, dto: UpdateDiscountDto) {
    await this.findOne(id, businessId);
    const { startsAt, endsAt, ...rest } = dto;
    return this.prisma.discount.update({
      where: { id },
      data: {
        ...rest,
        ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
        ...(endsAt !== undefined && { endsAt: new Date(endsAt) }),
      },
    });
  }

  async remove(id: number, businessId: number) {
    await this.findOne(id, businessId);
    return this.prisma.discount.delete({ where: { id } });
  }

  async validateDiscount(discountId: number, businessId: number, reason: string, userId?: number) {
    const allowedReasons = ['promotion', 'loyalty', 'negotiation'];
    if (!allowedReasons.includes(reason)) {
      throw new BadRequestException(
        `Invalid discount reason: "${reason}". Allowed: ${allowedReasons.join(', ')}`,
      );
    }

    const discount = await this.prisma.discount.findFirst({
      where: { id: discountId, businessId },
    });

    if (!discount) {
      throw new NotFoundException(`Discount #${discountId} not found`);
    }

    if (!discount.isActive) {
      throw new BadRequestException(`Discount #${discountId} is inactive`);
    }

    const now = new Date();
    if (discount.startsAt && discount.startsAt > now) {
      throw new BadRequestException(`Discount #${discountId} has not started yet`);
    }
    if (discount.endsAt && discount.endsAt < now) {
      throw new BadRequestException(`Discount #${discountId} has expired`);
    }

    this.auditLogs.logActivity(businessId, userId ?? null, 'VIEW', 'Discount', discountId, {
      reason,
      message: `Discount validated for reason: ${reason}`,
    });

    return { valid: true, discount };
  }

  applyDiscount(type: string, value: any, items: Record<string, any>[]) {
    if (!items || items.length === 0) {
      return { discountAmount: 0, items: [] };
    }

    let totalDiscount = 0;
    const resultItems = items.map((item) => ({
      productId: Number(item.productId) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 0,
      discountAmount: 0,
    }));

    if (type === 'percentage') {
      const rate = Number(value) || 0;
      for (const item of resultItems) {
        const lineTotal = item.unitPrice * item.quantity;
        const discount = (lineTotal * rate) / 100;
        item.discountAmount = Math.round(discount * 10000) / 10000;
        totalDiscount += item.discountAmount;
      }
    } else if (type === 'fixed') {
      const fixedAmount = Number(value) || 0;
      const lineTotals = resultItems.map((item) => item.unitPrice * item.quantity);
      const totalLineAmount = lineTotals.reduce((sum, val) => sum + val, 0);

      if (totalLineAmount > 0) {
        let distributedSum = 0;
        for (let i = 0; i < resultItems.length; i++) {
          if (i === resultItems.length - 1) {
            const discount = fixedAmount - distributedSum;
            resultItems[i].discountAmount = Math.round(discount * 10000) / 10000;
          } else {
            const fraction = lineTotals[i] / totalLineAmount;
            const discount = fixedAmount * fraction;
            resultItems[i].discountAmount = Math.round(discount * 10000) / 10000;
            distributedSum += resultItems[i].discountAmount;
          }
          totalDiscount += resultItems[i].discountAmount;
        }
      }
    } else if (type === 'buy_x_get_y') {
      let buyQty = 1;
      let getQty = 0;

      if (typeof value === 'object' && value !== null) {
        buyQty = Number((value as Record<string, any>).buyQty) || 1;
        getQty = Number((value as Record<string, any>).getQty) || 0;
      } else if (typeof value === 'string') {
        const match = value.match(/(\d+)[:_](\d+)/);
        if (match) {
          buyQty = parseInt(match[1], 10);
          getQty = parseInt(match[2], 10);
        } else {
          buyQty = parseInt(value, 10) || 1;
          getQty = 1;
        }
      } else {
        buyQty = Math.floor(Number(value)) || 1;
        getQty = 1;
      }

      for (const item of resultItems) {
        const qty = item.quantity;
        const unitPrice = item.unitPrice;
        if (buyQty + getQty > 0) {
          const sets = Math.floor(qty / (buyQty + getQty));
          const remaining = qty % (buyQty + getQty);
          const freeQty = sets * getQty + Math.max(0, remaining - buyQty);
          const discount = freeQty * unitPrice;
          item.discountAmount = Math.round(discount * 10000) / 10000;
          totalDiscount += item.discountAmount;
        }
      }
    }

    return {
      discountAmount: Math.round(totalDiscount * 10000) / 10000,
      items: resultItems,
    };
  }
}
