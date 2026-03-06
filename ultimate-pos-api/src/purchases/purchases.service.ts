import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePurchaseDto,
  PurchasePaymentStatus,
  PurchaseStatus,
  PurchaseType,
} from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { WebPushService } from '../push/web-push.service';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private auditLogs: AuditLogsService,
    private webPush: WebPushService,
  ) {}

  private async generateRefNo(businessId: number): Promise<string> {
    const today = new Date();
    const prefix = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.purchase.count({ where: { businessId } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(businessId: number, userId: number, dto: CreatePurchaseDto) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException(
        'Purchase must have at least one line item.',
      );
    }

    const refNo = dto.refNo || (await this.generateRefNo(businessId));

    let linesSubtotal = new Decimal(0);
    const purchaseLines = dto.lines.map((line) => {
      const qty = new Decimal(line.quantity);
      const cost = new Decimal(line.unitCostAfter);
      const disc = new Decimal(line.discountAmount ?? 0);
      const tax = new Decimal(line.taxAmount ?? 0);
      const lineTotal = qty.mul(cost).minus(disc).plus(tax);
      linesSubtotal = linesSubtotal.plus(lineTotal);
      return {
        productId: line.productId,
        quantity: qty,
        unitCostBefore: new Decimal(line.unitCostBefore),
        unitCostAfter: cost,
        discountAmount: disc,
        taxAmount: tax,
        lineTotal,
        ...(line.note ? { note: line.note } : {}),
      };
    });

    const discount = new Decimal(dto.discountAmount ?? 0);
    const tax = new Decimal(dto.taxAmount ?? 0);
    const shipping = new Decimal(dto.shippingAmount ?? 0);
    const totalAmount = linesSubtotal.minus(discount).plus(tax).plus(shipping);
    const paidAmount = new Decimal(dto.paidAmount ?? 0);

    let paymentStatus =
      dto.paymentStatus ?? PurchasePaymentStatus.DUE;
    if (!dto.paymentStatus) {
      if (paidAmount.greaterThanOrEqualTo(totalAmount)) {
        paymentStatus = PurchasePaymentStatus.PAID;
      } else if (paidAmount.greaterThan(0)) {
        paymentStatus = PurchasePaymentStatus.PARTIAL;
      }
    }

    const status = dto.status ?? PurchaseStatus.RECEIVED;

    const purchase = await this.prisma.purchase.create({
      data: {
        businessId,
        refNo,
        ...(dto.contactId ? { contactId: dto.contactId } : {}),
        status,
        paymentStatus,
        taxAmount: tax,
        discountAmount: discount,
        shippingAmount: shipping,
        totalAmount,
        paidAmount,
        ...(dto.note ? { note: dto.note } : {}),
        purchaseDate: dto.purchaseDate
          ? new Date(dto.purchaseDate)
          : new Date(),
        type: dto.type ?? PurchaseType.PURCHASE,
        createdBy: userId,
        lines: { create: purchaseLines },
      },
      include: {
        contact: { select: { id: true, name: true, mobile: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    // If received, add purchase_in stock entries
    if (status === PurchaseStatus.RECEIVED) {
      await Promise.all(
        purchaseLines.map((line) =>
          this.prisma.stockEntry.create({
            data: {
              businessId,
              productId: line.productId,
              entryType: 'purchase_in',
              quantity: line.quantity,
              unitCost: line.unitCostAfter,
              referenceNo: refNo,
              createdBy: userId,
            },
          }),
        ),
      );
    }

    // Invalidate cached data affected by new purchase
    await Promise.all([
      this.cacheManager.del(`dashboard_${businessId}`),
      this.cacheManager.del(`pos_products_${businessId}`),
    ]);

    this.auditLogs.log(businessId, userId, 'CREATE', 'Purchase', purchase.id, { refNo: purchase.refNo, total: Number(purchase.totalAmount), type: purchase.type });

    this.webPush.sendToUser(userId, {
      title: 'Purchase Order Created',
      body: `PO ${purchase.refNo ?? purchase.id} — ${purchase.totalAmount}`,
      icon: '/icons/icon-192x192.png',
      url: `/purchases/${purchase.id}`,
      tag: `purchase-${purchase.id}`,
    });

    return purchase;
  }

  async findAll(
    businessId: number,
    opts: {
      search?: string;
      status?: string;
      paymentStatus?: string;
      contactId?: number;
      type?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const {
      search,
      status,
      paymentStatus,
      contactId,
      type,
      page = 1,
      limit = 20,
    } = opts;
    const skip = (page - 1) * limit;

    const where: any = { businessId, deletedAt: null };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (contactId) where.contactId = contactId;
    // Default: exclude requisitions from normal purchase list; only show when explicitly requested
    if (type) {
      where.type = type;
    } else {
      where.type = PurchaseType.PURCHASE;
    }
    if (search) {
      where.OR = [
        { refNo: { contains: search } },
        { contact: { name: { contains: search } } },
      ];
    }

    const [total, purchases] = await Promise.all([
      this.prisma.purchase.count({ where }),
      this.prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: 'desc' },
        include: {
          contact: { select: { id: true, name: true, mobile: true } },
          lines: {
            select: {
              id: true,
              quantity: true,
              unitCostAfter: true,
              lineTotal: true,
            },
          },
        },
      }),
    ]);

    return { total, page, limit, data: purchases };
  }

  async findOne(businessId: number, id: number) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, businessId, deletedAt: null },
      include: {
        contact: {
          select: { id: true, name: true, mobile: true, email: true },
        },
        lines: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, type: true },
            },
          },
        },
      },
    });
    if (!purchase)
      throw new NotFoundException(`Purchase #${id} not found`);
    return purchase;
  }

  async update(businessId: number, id: number, dto: UpdatePurchaseDto) {
    await this.findOne(businessId, id);
    return this.prisma.purchase.update({
      where: { id },
      data: {
        ...(dto.contactId !== undefined ? { contactId: dto.contactId } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.paymentStatus ? { paymentStatus: dto.paymentStatus } : {}),
        ...(dto.taxAmount !== undefined ? { taxAmount: dto.taxAmount } : {}),
        ...(dto.discountAmount !== undefined
          ? { discountAmount: dto.discountAmount }
          : {}),
        ...(dto.shippingAmount !== undefined
          ? { shippingAmount: dto.shippingAmount }
          : {}),
        ...(dto.paidAmount !== undefined
          ? { paidAmount: dto.paidAmount }
          : {}),
        ...(dto.note ? { note: dto.note } : {}),
      },
      include: {
        contact: { select: { id: true, name: true, mobile: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });
  }

  async remove(businessId: number, id: number) {
    await this.findOne(businessId, id);
    await this.prisma.purchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: `Purchase #${id} deleted` };
  }

  async createReturn(
    businessId: number,
    userId: number,
    purchaseId: number,
    dto: { lines: { productId: number; quantity: number; unitCost: number }[]; note?: string },
  ) {
    const original = await this.findOne(businessId, purchaseId);
    if (original.type === 'purchase_return') {
      throw new BadRequestException('Cannot return a return transaction');
    }
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Return must have at least one line');
    }

    const today = new Date();
    const prefix = `PRR-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.purchase.count({ where: { businessId, type: 'purchase_return' } });
    const refNo = `${prefix}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = new Decimal(0);
    const returnLines = dto.lines.map((l) => {
      const lineTotal = new Decimal(l.quantity).mul(new Decimal(l.unitCost));
      totalAmount = totalAmount.plus(lineTotal);
      return {
        productId: l.productId,
        quantity: new Decimal(l.quantity),
        unitCostBefore: new Decimal(l.unitCost),
        unitCostAfter: new Decimal(l.unitCost),
        discountAmount: new Decimal(0),
        taxAmount: new Decimal(0),
        lineTotal,
      };
    });

    const returnPurchase = await this.prisma.purchase.create({
      data: {
        businessId,
        refNo,
        contactId: original.contactId,
        status: 'return',
        paymentStatus: 'paid',
        type: 'purchase_return',
        returnOfId: purchaseId,
        totalAmount,
        paidAmount: totalAmount,
        note: dto.note ?? `Return for ${original.refNo ?? '#' + purchaseId}`,
        createdBy: userId,
        lines: { create: returnLines },
      },
      include: {
        lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    // Remove stock for returned items
    await this.prisma.stockEntry.createMany({
      data: dto.lines.map((l) => ({
        businessId,
        productId: l.productId,
        entryType: 'adjustment_out',
        quantity: new Decimal(-l.quantity),
        note: `Purchase return for #${purchaseId}`,
        createdBy: userId,
      })),
    });

    return returnPurchase;
  }

  async convertToOrder(businessId: number, id: number) {
    const requisition = await this.prisma.purchase.findFirst({
      where: { id, businessId, type: PurchaseType.REQUISITION, deletedAt: null },
    });
    if (!requisition) {
      throw new NotFoundException(`Requisition #${id} not found`);
    }
    return this.prisma.purchase.update({
      where: { id },
      data: { type: PurchaseType.PURCHASE, status: 'ordered' },
      include: {
        contact: { select: { id: true, name: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });
  }

  async getSummary(businessId: number) {
    const [total, ordered, received, pending, due, partial] =
      await Promise.all([
        this.prisma.purchase.count({
          where: { businessId, deletedAt: null },
        }),
        this.prisma.purchase.count({
          where: { businessId, deletedAt: null, status: 'ordered' },
        }),
        this.prisma.purchase.count({
          where: { businessId, deletedAt: null, status: 'received' },
        }),
        this.prisma.purchase.count({
          where: { businessId, deletedAt: null, status: 'pending' },
        }),
        this.prisma.purchase.count({
          where: {
            businessId,
            deletedAt: null,
            paymentStatus: 'due',
          },
        }),
        this.prisma.purchase.count({
          where: {
            businessId,
            deletedAt: null,
            paymentStatus: 'partial',
          },
        }),
      ]);

    const totals = await this.prisma.purchase.aggregate({
      where: { businessId, deletedAt: null },
      _sum: { totalAmount: true, paidAmount: true },
    });

    return {
      totalPurchases: total,
      ordered,
      received,
      pending,
      due,
      partial,
      totalSpend: totals._sum.totalAmount ?? 0,
      totalPaid: totals._sum.paidAmount ?? 0,
      outstanding: (
        totals._sum.totalAmount ?? new Decimal(0)
      ).minus(totals._sum.paidAmount ?? new Decimal(0)),
    };
  }
}
