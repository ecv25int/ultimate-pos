import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseMapper } from './purchase.mapper';
import type {
  IPurchaseRepository,
  CreatePurchaseData,
  UpdatePurchaseData,
  PurchaseFilters,
  PaginatedPurchases,
  PurchaseSummary,
} from '../domain/purchase.repository';
import type { Purchase } from '../domain/purchase.entity';

const PURCHASE_INCLUDE = {
  contact: { select: { id: true, name: true, mobile: true, email: true } },
  lines: {
    include: { product: { select: { id: true, name: true, sku: true } } },
  },
} as const;

@Injectable()
export class PrismaPurchaseRepository implements IPurchaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async generateRefNo(businessId: number): Promise<string> {
    const today = new Date();
    const prefix = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const rows = await this.prisma.$queryRaw<[{ next: bigint }]>`
      SELECT COALESCE(MAX(id), 0) + 1 AS next
      FROM purchases
      WHERE business_id = ${businessId}
    `;
    return `${prefix}-${String(Number(rows[0].next)).padStart(4, '0')}`;
  }

  async countReturns(businessId: number): Promise<number> {
    return this.prisma.purchase.count({
      where: { businessId, type: 'purchase_return', deletedAt: null },
    });
  }

  async create(data: CreatePurchaseData): Promise<Purchase> {
    const row = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          businessId: data.businessId,
          refNo: data.refNo,
          ...(data.contactId != null ? { contactId: data.contactId } : {}),
          ...(data.returnOfId != null ? { returnOfId: data.returnOfId } : {}),
          status: data.status,
          paymentStatus: data.paymentStatus,
          type: data.type,
          taxAmount: data.taxAmount,
          discountAmount: data.discountAmount,
          shippingAmount: data.shippingAmount,
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          ...(data.note != null ? { note: data.note } : {}),
          purchaseDate: data.purchaseDate,
          createdBy: data.userId,
          lines: {
            create: data.lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitCostBefore: l.unitCostBefore,
              unitCostAfter: l.unitCostAfter,
              discountAmount: l.discountAmount,
              taxAmount: l.taxAmount,
              lineTotal: l.lineTotal,
              ...(l.note != null ? { note: l.note } : {}),
            })),
          },
        },
        include: PURCHASE_INCLUDE,
      });

      if (data.addStock) {
        await tx.stockEntry.createMany({
          data: data.lines.map((l) => ({
            businessId: data.businessId,
            productId: l.productId,
            entryType: 'purchase_in',
            quantity: l.quantity,
            unitCost: l.unitCostAfter,
            referenceNo: data.refNo,
            createdBy: data.userId,
          })),
        });
      } else if (data.removeStock) {
        await tx.stockEntry.createMany({
          data: data.lines.map((l) => ({
            businessId: data.businessId,
            productId: l.productId,
            entryType: 'adjustment_out',
            quantity: -l.quantity,
            note: `Purchase return for ${data.refNo}`,
            createdBy: data.userId,
          })),
        });
      }

      return purchase;
    });

    return PurchaseMapper.toEntity(row);
  }

  async findById(id: number, businessId: number): Promise<Purchase | null> {
    const row = await this.prisma.purchase.findFirst({
      where: { id, businessId, deletedAt: null },
      include: PURCHASE_INCLUDE,
    });
    return row ? PurchaseMapper.toEntity(row) : null;
  }

  async findAll(businessId: number, filters: PurchaseFilters): Promise<PaginatedPurchases> {
    const { search, status, paymentStatus, contactId, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { businessId, deletedAt: null, type: type ?? 'purchase' };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (contactId) where.contactId = contactId;
    if (search) {
      where.OR = [
        { refNo: { contains: search } },
        { contact: { name: { contains: search } } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.purchase.count({ where }),
      this.prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: 'desc' },
        include: PURCHASE_INCLUDE,
      }),
    ]);

    return { total, page, limit, data: rows.map((r) => PurchaseMapper.toEntity(r)) };
  }

  async update(id: number, businessId: number, data: UpdatePurchaseData): Promise<Purchase> {
    const row = await this.prisma.purchase.update({
      where: { id },
      data: {
        ...(data.contactId !== undefined ? { contactId: data.contactId ?? undefined } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.paymentStatus !== undefined ? { paymentStatus: data.paymentStatus } : {}),
        ...(data.taxAmount !== undefined ? { taxAmount: data.taxAmount } : {}),
        ...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),
        ...(data.shippingAmount !== undefined ? { shippingAmount: data.shippingAmount } : {}),
        ...(data.paidAmount !== undefined ? { paidAmount: data.paidAmount } : {}),
        ...(data.note !== undefined ? { note: data.note ?? undefined } : {}),
      },
      include: PURCHASE_INCLUDE,
    });
    return PurchaseMapper.toEntity(row);
  }

  async remove(id: number, _businessId: number): Promise<void> {
    await this.prisma.purchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async convertToOrder(id: number, _businessId: number): Promise<Purchase> {
    const row = await this.prisma.purchase.update({
      where: { id },
      data: { type: 'purchase', status: 'ordered' },
      include: PURCHASE_INCLUDE,
    });
    return PurchaseMapper.toEntity(row);
  }

  async getSummary(businessId: number): Promise<PurchaseSummary> {
    const [total, ordered, received, pending, due, partial, totals] = await Promise.all([
      this.prisma.purchase.count({ where: { businessId, deletedAt: null } }),
      this.prisma.purchase.count({ where: { businessId, deletedAt: null, status: 'ordered' } }),
      this.prisma.purchase.count({ where: { businessId, deletedAt: null, status: 'received' } }),
      this.prisma.purchase.count({ where: { businessId, deletedAt: null, status: 'pending' } }),
      this.prisma.purchase.count({ where: { businessId, deletedAt: null, paymentStatus: 'due' } }),
      this.prisma.purchase.count({ where: { businessId, deletedAt: null, paymentStatus: 'partial' } }),
      this.prisma.purchase.aggregate({
        where: { businessId, deletedAt: null },
        _sum: { totalAmount: true, paidAmount: true },
      }),
    ]);

    const totalSpend = Number(totals._sum.totalAmount ?? 0);
    const totalPaid = Number(totals._sum.paidAmount ?? 0);

    return {
      totalPurchases: total,
      ordered,
      received,
      pending,
      due,
      partial,
      totalSpend,
      totalPaid,
      outstanding: totalSpend - totalPaid,
    };
  }
}
