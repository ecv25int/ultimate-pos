import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, PaymentStatus } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebPushService } from '../push/web-push.service';
import { CheckAvailabilityUseCase } from '../inventory/application/use-cases/check-availability.use-case';
import { StockService } from '../inventory/stock.service';
import { BatchService } from '../inventory/batch.service';
import { PostingService } from '../accounting/posting.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private auditLogs: AuditLogsService,
    private notifications: NotificationsService,
    private webPush: WebPushService,
    private checkAvailability: CheckAvailabilityUseCase,
    private readonly stockService: StockService,
    private readonly batchService: BatchService,
    private readonly postingService: PostingService,
  ) {}

  // ------------------------------------------------------------
  // Generate invoice number: SALE-YYYYMMDD-XXXX
  // Uses MAX(id)+1 inside a serialisable context so concurrent
  // requests cannot collide and produce the same invoice number.
  // The @@unique([businessId, invoiceNo]) constraint is the last
  // line of defence — Prisma will throw P2002 if a duplicate
  // somehow slips through (callers should retry in that case).
  // ------------------------------------------------------------
  private async generateInvoiceNo(
    businessId: number,
    tx: typeof this.prisma = this.prisma,
  ): Promise<string> {
    const today = new Date();
    const prefix = `SALE-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    // MAX(id) gives a monotonically increasing sequence independent of
    // deletions/soft-deletes, unlike COUNT which can produce collisions.
    const rows = await tx.$queryRaw<[{ next: bigint }]>`
      SELECT COALESCE(MAX(id), 0) + 1 AS next
      FROM sales
      WHERE business_id = ${businessId}
    `;
    const seq = Number(rows[0].next);
    return `${prefix}-${String(seq).padStart(4, '0')}`;
  }

  // ------------------------------------------------------------
  // Create sale with lines
  // ------------------------------------------------------------
  async create(businessId: number, userId: number, dto: CreateSaleDto) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Sale must have at least one line item.');
    }

    const invoiceNo = await this.generateInvoiceNo(businessId);

    // Calculate totals
    let linesSubtotal = new Decimal(0);
    for (const line of dto.lines) {
      const qty = new Decimal(line.quantity);
      const price = new Decimal(line.unitPrice);
      const disc = new Decimal(line.discountAmount ?? 0);
      const tax = new Decimal(line.taxAmount ?? 0);
      const lineTotal = qty.mul(price).minus(disc).plus(tax);
      linesSubtotal = linesSubtotal.plus(lineTotal);
    }

    const discount = new Decimal(dto.discountAmount ?? 0);
    const tax = new Decimal(dto.taxAmount ?? 0);
    const shipping = new Decimal(dto.shippingAmount ?? 0);
    const totalAmount = linesSubtotal.minus(discount).plus(tax).plus(shipping);
    const paidAmount = new Decimal(dto.paidAmount ?? 0);

    // Determine payment status
    let paymentStatus = dto.paymentStatus ?? PaymentStatus.DUE;
    if (!dto.paymentStatus) {
      if (paidAmount.greaterThanOrEqualTo(totalAmount)) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount.greaterThan(0)) {
        paymentStatus = PaymentStatus.PARTIAL;
      }
    }

    // Validate stock availability for each line before committing
    await Promise.all(
      dto.lines.map((line) =>
        this.checkAvailability.assertAvailable(line.productId, businessId, line.quantity),
      ),
    );

    const sale = await this.prisma.$transaction(async (tx) => {
      const saleLinesData = [];
      for (const line of dto.lines) {
        const variation = await tx.variation.findFirst({
          where: { productId: line.productId },
          select: { id: true },
        });
        const variationId = (line as any).variationId || variation?.id || null;

        const qty = new Decimal(line.quantity);
        const price = new Decimal(line.unitPrice);
        const disc = new Decimal(line.discountAmount ?? 0);
        const tax = new Decimal(line.taxAmount ?? 0);
        const lineTotal = qty.mul(price).minus(disc).plus(tax);

        saleLinesData.push({
          productId: line.productId,
          variationId,
          quantity: qty,
          unitPrice: price,
          discountAmount: disc,
          taxAmount: tax,
          lineTotal,
          note: line.note ?? null,
        });
      }

      const createdSale = await tx.sale.create({
        data: {
          businessId,
          invoiceNo,
          ...(dto.contactId ? { contactId: dto.contactId } : {}),
          status: dto.status ?? 'final',
          paymentStatus,
          type: dto.type ?? 'sale',
          discountType: dto.discountType ?? 'fixed',
          discountAmount: discount,
          taxAmount: tax,
          shippingAmount: shipping,
          totalAmount,
          paidAmount,
          ...(dto.note ? { note: dto.note } : {}),
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          createdBy: userId,
          lines: { create: saleLinesData },
        },
        include: {
          contact: { select: { id: true, name: true, mobile: true } },
          lines: {
            include: { product: { select: { id: true, name: true, sku: true } } },
          },
        },
      });

      // Create stock_out entries for each line
      await Promise.all(
        saleLinesData.map((line) =>
          tx.stockEntry.create({
            data: {
              businessId,
              productId: line.productId,
              entryType: 'sale_out',
              quantity: line.quantity.negated(),
              referenceNo: invoiceNo,
              createdBy: userId,
            },
          }),
        ),
      );

      // Resolve default location for the business
      const defaultLoc = await tx.businessLocation.findFirst({
        where: { businessId, isActive: true },
        orderBy: { id: 'asc' },
        select: { id: true },
      });

      let totalCogs = new Decimal(0);

      if (defaultLoc) {
        for (const line of createdSale.lines) {
          const qty = Number(line.quantity);
          const variationId = line.variationId;

          if (variationId) {
            await this.stockService.updateStockLevel(
              variationId,
              defaultLoc.id,
              -qty,
              'sale',
              invoiceNo,
              dto.note ?? undefined,
              tx,
            );

            // If sale is final, perform FIFO batch mapping and COGS calculation
            if (createdSale.status === 'final') {
              const mappings = await this.batchService.mapPurchaseSell(
                line.id,
                variationId,
                qty,
                businessId,
                defaultLoc.id,
                tx,
              );

              let mappedQty = 0;
              for (const mapping of mappings) {
                const pl = await tx.purchaseLine.findUnique({
                  where: { id: mapping.purchaseLineId },
                  select: { unitCostAfter: true },
                });
                if (pl) {
                  const cost = new Decimal(pl.unitCostAfter);
                  const mappingQty = new Decimal(mapping.quantity);
                  totalCogs = totalCogs.plus(mappingQty.mul(cost));
                  mappedQty += Number(mapping.quantity);
                }
              }

              const unmappedQty = qty - mappedQty;
              if (unmappedQty > 0) {
                // Fallback: use the variation's default purchase price
                const variation = await tx.variation.findUnique({
                  where: { id: variationId },
                  select: { defaultPurchasePrice: true },
                });
                if (variation) {
                  const defaultCost = new Decimal(variation.defaultPurchasePrice || 0);
                  totalCogs = totalCogs.plus(new Decimal(unmappedQty).mul(defaultCost));
                }
              }
            }
          }
        }
      }

      return {
        ...createdSale,
        cogs: totalCogs.toNumber(),
      };
    });

    if (sale.status === 'final') {
      await this.postingService.postSaleToGL(businessId, sale.id);
    }

    // Invalidate cached data affected by new sale
    await Promise.all([
      this.cacheManager.del(`dashboard_${businessId}`),
      this.cacheManager.del(`pos_products_${businessId}`),
    ]);

    this.auditLogs.log(businessId, userId, 'CREATE', 'Sale', sale.id, {
      invoiceNo: sale.invoiceNo,
      total: Number(sale.totalAmount),
    });

    // SMS sale confirmation — fire-and-forget only when customer has a mobile
    if (dto.contactId) {
      const contact = await this.prisma.contact.findUnique({
        where: { id: dto.contactId },
        select: { name: true, mobile: true },
      });
      if (contact?.mobile && this.notifications.isSmsConfigured) {
        const business = await this.prisma.business.findUnique({
          where: { id: businessId },
          select: { name: true, currency: true },
        });
        this.notifications.sendSaleConfirmationSms(
          contact.mobile,
          contact.name,
          sale.invoiceNo ?? String(sale.id),
          Number(sale.totalAmount ?? 0),
          business?.currency ?? 'USD',
        );
      }
    }

    // Web push — notify the creating user (and any other logged-in session)
    this.webPush.sendToUser(userId, {
      title: 'New Sale Created',
      body: `Invoice ${sale.invoiceNo ?? sale.id} — ${sale.totalAmount}`,
      icon: '/icons/icon-192x192.png',
      url: `/sales/${sale.id}`,
      tag: `sale-${sale.id}`,
    });

    return sale;
  }

  // ------------------------------------------------------------
  // List sales with filters
  // ------------------------------------------------------------
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
    const { search, status, paymentStatus, contactId, type, page = 1, limit = 20 } = opts;
    const skip = (page - 1) * limit;

    const where: any = { businessId, deletedAt: null };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (contactId) where.contactId = contactId;
    if (type) where.type = type;
    if (search) {
      where.OR = [{ invoiceNo: { contains: search } }, { contact: { name: { contains: search } } }];
    }

    const [total, sales] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          contact: { select: { id: true, name: true, mobile: true } },
          lines: { select: { id: true, quantity: true, unitPrice: true, lineTotal: true } },
        },
      }),
    ]);

    return { total, page, limit, data: sales };
  }

  // ------------------------------------------------------------
  // Get single sale
  // ------------------------------------------------------------
  async findOne(businessId: number, id: number) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, businessId, deletedAt: null },
      include: {
        contact: { select: { id: true, name: true, mobile: true, email: true } },
        lines: {
          include: { product: { select: { id: true, name: true, sku: true, type: true } } },
        },
      },
    });
    if (!sale) throw new NotFoundException(`Sale #${id} not found`);
    return sale;
  }

  // ------------------------------------------------------------
  // Update sale header (no line changes)
  // ------------------------------------------------------------
  async update(businessId: number, id: number, dto: UpdateSaleDto) {
    await this.findOne(businessId, id);
    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        contactId: dto.contactId,
        status: dto.status,
        paymentStatus: dto.paymentStatus,
        discountType: dto.discountType,
        discountAmount: dto.discountAmount,
        taxAmount: dto.taxAmount,
        shippingAmount: dto.shippingAmount,
        paidAmount: dto.paidAmount,
        note: dto.note,
      },
      include: {
        contact: { select: { id: true, name: true, mobile: true } },
        lines: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });

    if (updated.status === 'final') {
      await this.postingService.postSaleToGL(businessId, updated.id);
    }

    return updated;
  }

  // ------------------------------------------------------------
  // Convert quotation → confirmed sale / convert draft → final
  // ------------------------------------------------------------
  async convertToInvoice(businessId: number, id: number) {
    const sale = await this.findOne(businessId, id);
    if (sale.type !== 'quotation' && sale.status !== 'draft') {
      throw new Error('Only quotations or drafts can be converted to invoices');
    }
    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        type: 'sale',
        status: 'final',
      },
      include: {
        contact: { select: { id: true, name: true, mobile: true } },
        lines: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });

    await this.postingService.postSaleToGL(businessId, updated.id);

    return updated;
  }

  // ------------------------------------------------------------
  // Soft delete
  // ------------------------------------------------------------
  async remove(businessId: number, id: number) {
    await this.findOne(businessId, id);
    await this.prisma.sale.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.auditLogs.log(businessId, null, 'DELETE', 'Sale', id);
    return { message: `Sale #${id} deleted` };
  }

  // ------------------------------------------------------------
  // Create sale return
  // ------------------------------------------------------------
  async createReturn(
    businessId: number,
    userId: number,
    saleId: number,
    dto: { lines: { productId: number; quantity: number; unitPrice: number }[]; note?: string },
  ) {
    const original = await this.findOne(businessId, saleId);
    if (original.type === 'sale_return') {
      throw new BadRequestException('Cannot return a return transaction');
    }
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Return must have at least one line');
    }

    const today = new Date();
    const prefix = `RET-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.sale.count({ where: { businessId, type: 'sale_return' } });
    const invoiceNo = `${prefix}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = new Decimal(0);
    const returnLines = dto.lines.map((l) => {
      const lineTotal = new Decimal(l.quantity).mul(new Decimal(l.unitPrice));
      totalAmount = totalAmount.plus(lineTotal);
      return {
        productId: l.productId,
        quantity: new Decimal(l.quantity),
        unitPrice: new Decimal(l.unitPrice),
        discountAmount: new Decimal(0),
        taxAmount: new Decimal(0),
        lineTotal,
      };
    });

    const returnSale = await this.prisma.$transaction(async (tx) => {
      const createdReturn = await tx.sale.create({
        data: {
          businessId,
          invoiceNo,
          contactId: original.contactId,
          status: 'return',
          paymentStatus: 'paid',
          type: 'sale_return',
          returnOfId: saleId,
          totalAmount,
          paidAmount: totalAmount,
          note: dto.note ?? `Return for ${original.invoiceNo}`,
          createdBy: userId,
          lines: { create: returnLines },
        },
        include: {
          lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });

      // Restock each returned item
      await Promise.all(
        dto.lines.map((l) =>
          tx.stockEntry.create({
            data: {
              businessId,
              productId: l.productId,
              entryType: 'sale_return',
              quantity: new Decimal(l.quantity),
              note: `Return for sale #${saleId}`,
              createdBy: userId,
            },
          }),
        ),
      );

      // Resolve default location for the business
      const defaultLoc = await tx.businessLocation.findFirst({
        where: { businessId, isActive: true },
        orderBy: { id: 'asc' },
        select: { id: true },
      });

      if (defaultLoc) {
        for (const line of dto.lines) {
          const variation = await tx.variation.findFirst({
            where: { productId: line.productId },
            select: { id: true },
          });

          if (variation) {
            await this.stockService.updateStockLevel(
              variation.id,
              defaultLoc.id,
              Math.abs(Number(line.quantity)),
              'return',
              invoiceNo,
              dto.note ?? undefined,
              tx,
            );
          }
        }
      }

      return createdReturn;
    });

    return returnSale;
  }

  // ------------------------------------------------------------
  // Sales summary stats
  // ------------------------------------------------------------
  async getSummary(businessId: number) {
    const [total, draft, finalCount, pending, due, partial] = await Promise.all([
      this.prisma.sale.count({ where: { businessId, deletedAt: null } }),
      this.prisma.sale.count({ where: { businessId, deletedAt: null, status: 'draft' } }),
      this.prisma.sale.count({ where: { businessId, deletedAt: null, status: 'final' } }),
      this.prisma.sale.count({ where: { businessId, deletedAt: null, status: 'pending' } }),
      this.prisma.sale.count({ where: { businessId, deletedAt: null, paymentStatus: 'due' } }),
      this.prisma.sale.count({ where: { businessId, deletedAt: null, paymentStatus: 'partial' } }),
    ]);

    const totals = await this.prisma.sale.aggregate({
      where: { businessId, deletedAt: null },
      _sum: { totalAmount: true, paidAmount: true },
    });

    return {
      totalSales: total,
      draft,
      final: finalCount,
      pending,
      due,
      partial,
      totalRevenue: totals._sum.totalAmount ?? 0,
      totalCollected: totals._sum.paidAmount ?? 0,
      outstanding: (totals._sum.totalAmount ?? new Decimal(0)).minus(
        totals._sum.paidAmount ?? new Decimal(0),
      ),
    };
  }
}
