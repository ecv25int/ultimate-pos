import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMapper } from './payment.mapper';
import type {
  IPaymentRepository,
  CreatePaymentData,
  PaymentFilters,
  PaginatedPayments,
  TransactionRef,
} from '../domain/payment.repository';
import type { Payment } from '../domain/payment.entity';

const PAYMENT_INCLUDE = {
  sale: { select: { id: true, invoiceNo: true } },
  purchase: { select: { id: true, refNo: true } },
} as const;

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentData): Promise<Payment> {
    const row = await this.prisma.payment.create({
      data: {
        businessId: data.businessId,
        saleId: data.saleId ?? null,
        purchaseId: data.purchaseId ?? null,
        amount: data.amount,
        method: data.method,
        referenceNo: data.referenceNo ?? null,
        note: data.note ?? null,
        paymentDate: data.paymentDate,
        createdBy: data.userId,
      },
      include: PAYMENT_INCLUDE,
    });
    return PaymentMapper.toEntity(row);
  }

  async findAll(businessId: number, filters: PaymentFilters): Promise<PaginatedPayments> {
    const { saleId, purchaseId, method, page = 1, limit = 30 } = filters;
    const skip = (page - 1) * limit;
    const where = {
      businessId,
      ...(saleId != null ? { saleId } : {}),
      ...(purchaseId != null ? { purchaseId } : {}),
      ...(method ? { method } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
        include: PAYMENT_INCLUDE,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: rows.map((r) => PaymentMapper.toEntity(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number, businessId: number): Promise<Payment | null> {
    const row = await this.prisma.payment.findFirst({
      where: { id, businessId },
      include: PAYMENT_INCLUDE,
    });
    return row ? PaymentMapper.toEntity(row) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.payment.delete({ where: { id } });
  }

  async getTotalPaid(businessId: number, saleId?: number, purchaseId?: number): Promise<number> {
    const agg = await this.prisma.payment.aggregate({
      where: {
        businessId,
        ...(saleId != null ? { saleId } : {}),
        ...(purchaseId != null ? { purchaseId } : {}),
      },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount ?? 0);
  }

  async findSale(saleId: number, businessId: number): Promise<TransactionRef | null> {
    const row = await this.prisma.sale.findFirst({
      where: { id: saleId, businessId, deletedAt: null },
      select: { id: true, totalAmount: true, paidAmount: true },
    });
    if (!row) return null;
    return { id: row.id, totalAmount: Number(row.totalAmount), paidAmount: Number(row.paidAmount) };
  }

  async findPurchase(purchaseId: number, businessId: number): Promise<TransactionRef | null> {
    const row = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, businessId, deletedAt: null },
      select: { id: true, totalAmount: true, paidAmount: true },
    });
    if (!row) return null;
    return { id: row.id, totalAmount: Number(row.totalAmount), paidAmount: Number(row.paidAmount) };
  }

  async updateSalePaymentStatus(saleId: number, paidAmount: number, paymentStatus: string): Promise<void> {
    await this.prisma.sale.update({
      where: { id: saleId },
      data: { paidAmount, paymentStatus },
    });
  }

  async updatePurchasePaymentStatus(purchaseId: number, paidAmount: number, paymentStatus: string): Promise<void> {
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { paidAmount, paymentStatus },
    });
  }
}
