import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, businessId: number, dto: CreateContactDto) {
    // If mobile provided, check for duplicate within the business
    const existing = await this.prisma.contact.findFirst({
      where: {
        businessId,
        mobile: dto.mobile,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'A contact with this mobile number already exists in your business',
      );
    }

    return this.prisma.contact.create({
      data: {
        businessId,
        type: dto.type,
        name: dto.name,
        supplierBusinessName: dto.supplierBusinessName ?? null,
        email: dto.email ?? null,
        taxNumber: dto.taxNumber ?? null,
        mobile: dto.mobile,
        landline: dto.landline ?? null,
        alternateNumber: dto.alternateNumber ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        country: dto.country ?? null,
        landmark: dto.landmark ?? null,
        shippingAddress: dto.shippingAddress ?? null,
        position: dto.position ?? null,
        payTermNumber: dto.payTermNumber ?? null,
        payTermType: dto.payTermType ?? null,
        creditLimit: dto.creditLimit ?? null,
        isDefault: dto.isDefault ?? false,
        contactStatus: dto.contactStatus ?? 'active',
        createdBy: userId,
      },
    });
  }

  async findAll(
    businessId: number,
    type?: string,
    status?: string,
    search?: string,
  ) {
    const where: any = {
      businessId,
      deletedAt: null,
    };

    if (type && ['customer', 'supplier', 'both'].includes(type)) {
      if (type === 'customer') {
        where.type = { in: ['customer', 'both'] };
      } else if (type === 'supplier') {
        where.type = { in: ['supplier', 'both'] };
      } else {
        where.type = type;
      }
    }

    if (status && ['active', 'inactive'].includes(status)) {
      where.contactStatus = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
        { supplierBusinessName: { contains: search } },
      ];
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        type: true,
        name: true,
        supplierBusinessName: true,
        email: true,
        mobile: true,
        city: true,
        state: true,
        country: true,
        creditLimit: true,
        balance: true,
        contactStatus: true,
        isDefault: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: number, businessId: number) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, businessId, deletedAt: null },
    });

    if (!contact) {
      throw new NotFoundException(`Contact #${id} not found`);
    }

    return contact;
  }

  async update(id: number, businessId: number, dto: UpdateContactDto) {
    await this.findOne(id, businessId);

    // Check for duplicate mobile if being updated
    if (dto.mobile) {
      const duplicate = await this.prisma.contact.findFirst({
        where: {
          businessId,
          mobile: dto.mobile,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Another contact with this mobile number already exists',
        );
      }
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.supplierBusinessName !== undefined && {
          supplierBusinessName: dto.supplierBusinessName,
        }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.taxNumber !== undefined && { taxNumber: dto.taxNumber }),
        ...(dto.mobile !== undefined && { mobile: dto.mobile }),
        ...(dto.landline !== undefined && { landline: dto.landline }),
        ...(dto.alternateNumber !== undefined && {
          alternateNumber: dto.alternateNumber,
        }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.landmark !== undefined && { landmark: dto.landmark }),
        ...(dto.shippingAddress !== undefined && {
          shippingAddress: dto.shippingAddress,
        }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.payTermNumber !== undefined && {
          payTermNumber: dto.payTermNumber,
        }),
        ...(dto.payTermType !== undefined && { payTermType: dto.payTermType }),
        ...(dto.creditLimit !== undefined && { creditLimit: dto.creditLimit }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.contactStatus !== undefined && {
          contactStatus: dto.contactStatus,
        }),
      },
    });
  }

  async remove(id: number, businessId: number) {
    await this.findOne(id, businessId);

    // Soft delete
    await this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Contact deleted successfully' };
  }

  async toggleStatus(id: number, businessId: number) {
    const contact = await this.findOne(id, businessId);
    const newStatus = contact.contactStatus === 'active' ? 'inactive' : 'active';

    return this.prisma.contact.update({
      where: { id },
      data: { contactStatus: newStatus },
    });
  }

  /**
   * Contact ledger: sales receivable + purchase payable summary
   */
  async getLedger(id: number, businessId: number) {
    await this.findOne(id, businessId);

    const [salesAgg, purchasesAgg, recentSales, recentPurchases] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { contactId: id, businessId, deletedAt: null, type: 'sale' },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
      this.prisma.purchase.aggregate({
        where: { contactId: id, businessId, deletedAt: null, type: 'purchase' },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
      this.prisma.sale.findMany({
        where: { contactId: id, businessId, deletedAt: null, type: 'sale' },
        orderBy: { transactionDate: 'desc' },
        take: 10,
        select: { id: true, invoiceNo: true, transactionDate: true, totalAmount: true, paidAmount: true, paymentStatus: true, status: true },
      }),
      this.prisma.purchase.findMany({
        where: { contactId: id, businessId, deletedAt: null, type: 'purchase' },
        orderBy: { purchaseDate: 'desc' },
        take: 10,
        select: { id: true, refNo: true, purchaseDate: true, totalAmount: true, paidAmount: true, paymentStatus: true, status: true },
      }),
    ]);

    const totalSales = Number(salesAgg._sum.totalAmount ?? 0);
    const totalSalesPaid = Number(salesAgg._sum.paidAmount ?? 0);
    const totalPurchases = Number(purchasesAgg._sum.totalAmount ?? 0);
    const totalPurchasesPaid = Number(purchasesAgg._sum.paidAmount ?? 0);

    return {
      salesCount: salesAgg._count,
      totalSales,
      totalSalesPaid,
      salesDue: totalSales - totalSalesPaid,
      purchasesCount: purchasesAgg._count,
      totalPurchases,
      totalPurchasesPaid,
      purchasesDue: totalPurchases - totalPurchasesPaid,
      netBalance: totalSales - totalSalesPaid - (totalPurchases - totalPurchasesPaid),
      recentSales,
      recentPurchases,
    };
  }

  /**
   * Returns unpaid/partially-paid sales and purchases for a contact — practical
   * "overdue" view even if the schema has no explicit due-date column.
   */
  async getOverdueInvoices(id: number, businessId: number) {
    await this.findOne(id, businessId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [sales, purchases] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          contactId: id,
          businessId,
          deletedAt: null,
          type: 'sale',
          paymentStatus: { in: ['due', 'partial', 'overdue'] },
        },
        orderBy: { transactionDate: 'asc' },
        select: {
          id: true,
          invoiceNo: true,
          transactionDate: true,
          totalAmount: true,
          paidAmount: true,
          paymentStatus: true,
          status: true,
        },
      }),
      this.prisma.purchase.findMany({
        where: {
          contactId: id,
          businessId,
          deletedAt: null,
          type: 'purchase',
          paymentStatus: { in: ['due', 'partial', 'overdue'] },
        },
        orderBy: { purchaseDate: 'asc' },
        select: {
          id: true,
          refNo: true,
          purchaseDate: true,
          totalAmount: true,
          paidAmount: true,
          paymentStatus: true,
          status: true,
        },
      }),
    ]);

    const totalSalesOwed = sales.reduce((sum, s) => sum + (Number(s.totalAmount) - Number(s.paidAmount)), 0);
    const totalPurchasesOwed = purchases.reduce((sum, p) => sum + (Number(p.totalAmount) - Number(p.paidAmount)), 0);

    return {
      overdueSales: sales,
      overduePurchases: purchases,
      totalSalesOwed,
      totalPurchasesOwed,
      overdueCount: sales.length + purchases.length,
    };
  }

  /**
   * Bulk import contacts from CSV rows
   */
  async importContacts(
    businessId: number,
    userId: number,
    rows: {
      type: string;
      name: string;
      mobile: string;
      email?: string;
      city?: string;
      state?: string;
      country?: string;
      creditLimit?: string;
    }[],
  ) {
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.name || !row.mobile) { skipped++; continue; }
      const type = ['customer', 'supplier', 'both'].includes(row.type) ? row.type : 'customer';
      const existing = await this.prisma.contact.findFirst({
        where: { businessId, mobile: row.mobile, deletedAt: null },
      });
      if (existing) { skipped++; continue; }
      await this.prisma.contact.create({
        data: {
          businessId,
          type,
          name: row.name,
          mobile: row.mobile,
          email: row.email ?? null,
          city: row.city ?? null,
          state: row.state ?? null,
          country: row.country ?? null,
          creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : null,
          createdBy: userId,
        },
      });
      created++;
    }

    return { created, skipped, total: rows.length };
  }

  /**
   * Export all contacts for a business as a CSV string
   */
  async exportToCsv(businessId: number): Promise<string> {
    const contacts = await this.prisma.contact.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const headers = [
      'id', 'type', 'name', 'supplier_business_name',
      'email', 'mobile', 'landline', 'alternate_number',
      'tax_number', 'city', 'state', 'country',
      'credit_limit', 'balance', 'contact_status',
    ];

    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = contacts.map((c) => [
      c.id, c.type, c.name, c.supplierBusinessName ?? '',
      c.email ?? '', c.mobile, c.landline ?? '', c.alternateNumber ?? '',
      c.taxNumber ?? '', c.city ?? '', c.state ?? '', c.country ?? '',
      Number(c.creditLimit ?? 0), Number(c.balance), c.contactStatus,
    ].map(escape).join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}
