import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: number, userId: number, dto: CreatePaymentDto) {
    if (!dto.saleId && !dto.purchaseId) {
      throw new BadRequestException('Either saleId or purchaseId is required');
    }

    // Verify the sale/purchase belongs to this business
    if (dto.saleId) {
      const sale = await this.prisma.sale.findFirst({
        where: { id: dto.saleId, businessId, deletedAt: null },
      });
      if (!sale) throw new NotFoundException(`Sale #${dto.saleId} not found`);
    }
    if (dto.purchaseId) {
      const purchase = await this.prisma.purchase.findFirst({
        where: { id: dto.purchaseId, businessId, deletedAt: null },
      });
      if (!purchase) throw new NotFoundException(`Purchase #${dto.purchaseId} not found`);
    }

    // Create the payment
    const payment = await this.prisma.payment.create({
      data: {
        businessId,
        saleId: dto.saleId ?? null,
        purchaseId: dto.purchaseId ?? null,
        amount: dto.amount,
        method: dto.method ?? 'cash',
        referenceNo: dto.referenceNo ?? null,
        note: dto.note ?? null,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        createdBy: userId,
      },
      include: {
        sale: { select: { id: true, invoiceNo: true } },
        purchase: { select: { id: true, refNo: true } },
      },
    });

    // Update paidAmount on the parent record
    if (dto.saleId) {
      const allPayments = await this.prisma.payment.aggregate({
        where: { saleId: dto.saleId, businessId },
        _sum: { amount: true },
      });
      const totalPaid = Number(allPayments._sum.amount ?? 0);
      const sale = await this.prisma.sale.findUnique({ where: { id: dto.saleId } });
      const total = Number(sale!.totalAmount);
      await this.prisma.sale.update({
        where: { id: dto.saleId },
        data: {
          paidAmount: totalPaid,
          paymentStatus:
            totalPaid >= total
              ? 'paid'
              : totalPaid > 0
                ? 'partial'
                : 'due',
        },
      });
    }

    if (dto.purchaseId) {
      const allPayments = await this.prisma.payment.aggregate({
        where: { purchaseId: dto.purchaseId, businessId },
        _sum: { amount: true },
      });
      const totalPaid = Number(allPayments._sum.amount ?? 0);
      const purchase = await this.prisma.purchase.findUnique({ where: { id: dto.purchaseId } });
      const total = Number(purchase!.totalAmount);
      await this.prisma.purchase.update({
        where: { id: dto.purchaseId },
        data: {
          paidAmount: totalPaid,
          paymentStatus:
            totalPaid >= total
              ? 'paid'
              : totalPaid > 0
                ? 'partial'
                : 'due',
        },
      });
    }

    return payment;
  }

  async findAll(
    businessId: number,
    opts: {
      saleId?: number;
      purchaseId?: number;
      method?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { saleId, purchaseId, method, page = 1, limit = 30 } = opts;
    const skip = (page - 1) * limit;
    const where = {
      businessId,
      ...(saleId ? { saleId } : {}),
      ...(purchaseId ? { purchaseId } : {}),
      ...(method ? { method } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
        include: {
          sale: { select: { id: true, invoiceNo: true } },
          purchase: { select: { id: true, refNo: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(businessId: number, id: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, businessId },
      include: {
        sale: { select: { id: true, invoiceNo: true, totalAmount: true, paidAmount: true } },
        purchase: { select: { id: true, refNo: true, totalAmount: true, paidAmount: true } },
      },
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async remove(businessId: number, id: number) {
    const payment = await this.findOne(businessId, id);
    await this.prisma.payment.delete({ where: { id } });

    // Recalculate paidAmount after deletion
    if (payment.saleId) {
      const agg = await this.prisma.payment.aggregate({
        where: { saleId: payment.saleId, businessId },
        _sum: { amount: true },
      });
      const totalPaid = Number(agg._sum.amount ?? 0);
      const sale = await this.prisma.sale.findUnique({ where: { id: payment.saleId } });
      const total = Number(sale!.totalAmount);
      await this.prisma.sale.update({
        where: { id: payment.saleId },
        data: {
          paidAmount: totalPaid,
          paymentStatus: totalPaid >= total ? 'paid' : totalPaid > 0 ? 'partial' : 'due',
        },
      });
    }

    if (payment.purchaseId) {
      const agg = await this.prisma.payment.aggregate({
        where: { purchaseId: payment.purchaseId, businessId },
        _sum: { amount: true },
      });
      const totalPaid = Number(agg._sum.amount ?? 0);
      const purchase = await this.prisma.purchase.findUnique({ where: { id: payment.purchaseId } });
      const total = Number(purchase!.totalAmount);
      await this.prisma.purchase.update({
        where: { id: payment.purchaseId },
        data: {
          paidAmount: totalPaid,
          paymentStatus: totalPaid >= total ? 'paid' : totalPaid > 0 ? 'partial' : 'due',
        },
      });
    }

    return { message: 'Payment deleted' };
  }

  async createBulk(businessId: number, userId: number, payments: CreatePaymentDto[]) {
    if (!payments.length) {
      throw new BadRequestException('No payments provided');
    }
    const results: any[] = [];
    for (const dto of payments) {
      const payment = await this.create(businessId, userId, dto);
      results.push(payment);
    }
    return { created: results.length, payments: results };
  }
}
