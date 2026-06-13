import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import type { OriginalSale, SaleReturn } from '../domain/sale-return.entity';
import type { CreateSaleReturnData, ISaleReturnRepository } from '../domain/sale-return.repository';
import { SaleReturnMapper } from './sale-return.mapper';

const RETURN_LINE_INCLUDE = {
  lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
} as const;

@Injectable()
export class PrismaSaleReturnRepository implements ISaleReturnRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOriginalWithLines(saleId: number, businessId: number): Promise<OriginalSale | null> {
    const row = await this.prisma.sale.findFirst({
      where: { id: saleId, businessId, deletedAt: null },
      include: { lines: true },
    });
    return row ? SaleReturnMapper.toOriginalSale(row) : null;
  }

  async create(data: CreateSaleReturnData): Promise<SaleReturn> {
    const row = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          businessId: data.businessId,
          invoiceNo: data.invoiceNo,
          contactId: data.contactId,
          status: 'return',
          paymentStatus: 'paid',
          type: 'sale_return',
          returnOfId: data.returnOfId,
          discountAmount: new Decimal(data.discountAmount),
          taxAmount: new Decimal(data.taxAmount),
          shippingAmount: new Decimal(data.shippingAmount),
          totalAmount: new Decimal(data.totalAmount),
          paidAmount: new Decimal(data.paidAmount),
          note: data.note,
          transactionDate: new Date(),
          createdBy: data.userId,
          lines: {
            create: data.lines.map((l) => ({
              productId: l.productId,
              quantity: new Decimal(l.quantity),
              unitPrice: new Decimal(l.unitPrice),
              discountAmount: new Decimal(l.discountAmount),
              taxAmount: new Decimal(l.taxAmount),
              lineTotal: new Decimal(l.lineTotal),
              ...(l.note ? { note: l.note } : {}),
            })),
          },
        },
        include: RETURN_LINE_INCLUDE,
      });

      // Restock returned items
      await tx.stockEntry.createMany({
        data: data.lines.map((l) => ({
          businessId: data.businessId,
          productId: l.productId,
          entryType: 'sale_return',
          quantity: new Decimal(l.quantity),
          note: `Return for sale #${data.returnOfId}`,
          createdBy: data.userId,
        })),
      });

      return sale;
    });

    return SaleReturnMapper.toEntity(row);
  }

  async findById(id: number, businessId: number): Promise<SaleReturn | null> {
    const row = await this.prisma.sale.findFirst({
      where: { id, businessId, type: 'sale_return', deletedAt: null },
      include: RETURN_LINE_INCLUDE,
    });
    return row ? SaleReturnMapper.toEntity(row) : null;
  }

  async findBySaleId(saleId: number, businessId: number): Promise<SaleReturn[]> {
    const rows = await this.prisma.sale.findMany({
      where: { businessId, type: 'sale_return', returnOfId: saleId, deletedAt: null },
      include: RETURN_LINE_INCLUDE,
      orderBy: { transactionDate: 'desc' },
    });
    return rows.map(SaleReturnMapper.toEntity);
  }

  async generateInvoiceNo(businessId: number): Promise<string> {
    const today = new Date();
    const prefix = `RET-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const rows = await this.prisma.$queryRaw<[{ next: bigint }]>`
      SELECT COALESCE(MAX(id), 0) + 1 AS next
      FROM sales
      WHERE business_id = ${businessId} AND type = 'sale_return'
    `;
    const seq = Number(rows[0].next);
    return `${prefix}-${String(seq).padStart(4, '0')}`;
  }
}
