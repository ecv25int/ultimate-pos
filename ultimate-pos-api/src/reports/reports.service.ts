import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /** Dashboard summary: sales, purchases, stock stats */
  async getDashboard(businessId: number) {
    const cacheKey = `dashboard_${businessId}`;
    const cached = await this.cacheManager.get<object>(cacheKey);
    if (cached) return cached;

    const result = await this._computeDashboard(businessId);
    await this.cacheManager.set(cacheKey, result, 300000); // 5 min
    return result;
  }

  private async _computeDashboard(businessId: number) {
    const [totalSales, totalRevenue, totalPurchases, totalSpend] =
      await Promise.all([
        this.prisma.sale.count({ where: { businessId, deletedAt: null } }),
        this.prisma.sale.aggregate({
          where: { businessId, deletedAt: null },
          _sum: { totalAmount: true },
        }),
        this.prisma.purchase.count({ where: { businessId, deletedAt: null } }),
        this.prisma.purchase.aggregate({
          where: { businessId, deletedAt: null },
          _sum: { totalAmount: true },
        }),
      ]);

    const stockAgg = await this.prisma.stockEntry.groupBy({
      by: ['productId'],
      where: { businessId },
      _sum: { quantity: true },
    });

    const productsAlert = await this.prisma.product.findMany({
      where: { businessId },
      select: { id: true, alertQuantity: true },
    });
    const alertMap = new Map(
      productsAlert.map((p) => [p.id, Number(p.alertQuantity ?? 5)]),
    );

    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const row of stockAgg) {
      const net = Number(row._sum.quantity ?? 0);
      if (net <= 0) outOfStockCount++;
      else if (net <= (alertMap.get(row.productId) ?? 5)) lowStockCount++;
    }

    return {
      totalSales,
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
      totalPurchases,
      totalSpend: Number(totalSpend._sum.totalAmount ?? 0),
      lowStockCount,
      outOfStockCount,
    };
  }

  /** Sales report with optional date range */
  async getSalesReport(businessId: number, from?: string, to?: string) {
    const where: any = { businessId, deletedAt: null };
    if (from || to) {
      where.transactionDate = {};
      if (from) where.transactionDate.gte = new Date(from);
      if (to) where.transactionDate.lte = new Date(to);
    }

    const [sales, aggregate] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        take: 50,
        include: {
          contact: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.sale.aggregate({
        where,
        _sum: { totalAmount: true, paidAmount: true, discountAmount: true, taxAmount: true },
        _count: { id: true },
      }),
    ]);

    return { sales, summary: aggregate };
  }

  /** Purchases report with optional date range */
  async getPurchasesReport(businessId: number, from?: string, to?: string) {
    const where: any = { businessId, deletedAt: null };
    if (from || to) {
      where.purchaseDate = {};
      if (from) where.purchaseDate.gte = new Date(from);
      if (to) where.purchaseDate.lte = new Date(to);
    }

    const [purchases, aggregate] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        orderBy: { purchaseDate: 'desc' },
        take: 50,
        include: {
          contact: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.purchase.aggregate({
        where,
        _sum: { totalAmount: true, paidAmount: true, discountAmount: true, taxAmount: true },
        _count: { id: true },
      }),
    ]);

    return { purchases, summary: aggregate };
  }

  /** Stock report: products with net stock computed from stock_entries */
  async getStockReport(businessId: number) {
    const products = await this.prisma.product.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        sku: true,
        alertQuantity: true,
        unit: { select: { actualName: true, shortName: true } },
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const stockAgg = await this.prisma.stockEntry.groupBy({
      by: ['productId'],
      where: { businessId },
      _sum: { quantity: true, unitCost: true },
    });
    const stockMap = new Map(
      stockAgg.map((s) => [
        s.productId,
        {
          qty: Number(s._sum.quantity ?? 0),
          cost: s._sum.unitCost ? Number(s._sum.unitCost) : 0,
        },
      ]),
    );

    const enriched = products.map((p) => {
      const stock = stockMap.get(p.id) ?? { qty: 0, cost: 0 };
      return {
        ...p,
        alertQuantity: Number(p.alertQuantity),
        currentStock: stock.qty,
        unitCost: stock.cost,
      };
    });

    const totalValue = enriched.reduce(
      (sum, p) => sum + p.currentStock * p.unitCost,
      0,
    );

    return {
      products: enriched.sort((a, b) => a.currentStock - b.currentStock),
      totalValue,
      totalProducts: enriched.length,
    };
  }

  /** Top selling products by quantity */
  async getTopProducts(businessId: number, limit = 10) {
    const result = await this.prisma.saleLine.groupBy({
      by: ['productId'],
      where: { sale: { businessId, deletedAt: null } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = result.map((r) => r.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });

    return result.map((r) => ({
      productId: r.productId,
      product: products.find((p) => p.id === r.productId),
      totalQty: Number(r._sum.quantity ?? 0),
      totalRevenue: Number(r._sum.lineTotal ?? 0),
    }));
  }

  /** Revenue by period (day / month) */
  async getRevenueByPeriod(
    businessId: number,
    groupBy: 'day' | 'month',
    days: number,
  ) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    if (groupBy === 'day') {
      const rows = await this.prisma.$queryRaw<
        { period: string; revenue: number; orders: bigint }[]
      >`
        SELECT DATE(transaction_date) as period,
               SUM(total_amount) as revenue,
               COUNT(*) as orders
        FROM sales
        WHERE business_id = ${businessId}
          AND deleted_at IS NULL
          AND transaction_date >= ${since}
        GROUP BY DATE(transaction_date)
        ORDER BY period ASC
      `;
      return rows.map((r) => ({ period: r.period, revenue: Number(r.revenue), orders: Number(r.orders) }));
    } else {
      const rows = await this.prisma.$queryRaw<
        { period: string; revenue: number; orders: bigint }[]
      >`
        SELECT DATE_FORMAT(transaction_date, '%Y-%m') as period,
               SUM(total_amount) as revenue,
               COUNT(*) as orders
        FROM sales
        WHERE business_id = ${businessId}
          AND deleted_at IS NULL
          AND transaction_date >= ${since}
        GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
        ORDER BY period ASC
      `;
      return rows.map((r) => ({ period: r.period, revenue: Number(r.revenue), orders: Number(r.orders) }));
    }
  }

  // ─── Excel Export ────────────────────────────────────────────────────────────

  private createWorkbook(sheetName: string) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Ultimate POS';
    wb.created = new Date();
    const ws = wb.addWorksheet(sheetName);
    return { wb, ws };
  }

  private styleHeaderRow(ws: ExcelJS.Worksheet, colCount: number) {
    const row = ws.getRow(1);
    for (let i = 1; i <= colCount; i++) {
      const cell = row.getCell(i);
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3F51B5' } };
      cell.alignment = { horizontal: 'center' };
    }
    row.height = 20;
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colCount } };
  }

  async exportSalesExcel(
    businessId: number,
    from?: string,
    to?: string,
  ): Promise<Buffer> {
    const { sales } = await this.getSalesReport(businessId, from, to);
    const { wb, ws } = this.createWorkbook('Sales Report');

    ws.columns = [
      { header: 'Invoice #',   key: 'invoiceNo',        width: 18 },
      { header: 'Date',        key: 'date',             width: 14 },
      { header: 'Customer',    key: 'customer',         width: 24 },
      { header: 'Status',      key: 'status',           width: 12 },
      { header: 'Items',       key: 'items',            width: 8  },
      { header: 'Subtotal',    key: 'subtotal',         width: 14 },
      { header: 'Discount',    key: 'discount',         width: 12 },
      { header: 'Tax',         key: 'tax',              width: 12 },
      { header: 'Total',       key: 'total',            width: 14 },
      { header: 'Paid',        key: 'paid',             width: 14 },
      { header: 'Balance Due', key: 'due',              width: 14 },
    ];
    this.styleHeaderRow(ws, ws.columns.length);

    for (const s of sales) {
      ws.addRow({
        invoiceNo: (s as any).invoiceNo ?? s.id,
        date: new Date((s as any).transactionDate).toLocaleDateString(),
        customer: (s as any).contact?.name ?? '—',
        status: s.status,
        items: (s as any)._count?.lines ?? 0,
        subtotal: Number(s.totalAmount) - Number(s.taxAmount ?? 0) + Number(s.discountAmount ?? 0),
        discount: Number(s.discountAmount ?? 0),
        tax: Number(s.taxAmount ?? 0),
        total: Number(s.totalAmount),
        paid: Number(s.paidAmount ?? 0),
        due: Math.max(Number(s.totalAmount) - Number(s.paidAmount ?? 0), 0),
      });
    }
    // Currency columns
    ['subtotal','discount','tax','total','paid','due'].forEach((key) => {
      const col = ws.getColumn(key);
      col.numFmt = '"$"#,##0.00';
    });
    ws.getColumn('items').numFmt = '0';

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async exportPurchasesExcel(
    businessId: number,
    from?: string,
    to?: string,
  ): Promise<Buffer> {
    const { purchases } = await this.getPurchasesReport(businessId, from, to);
    const { wb, ws } = this.createWorkbook('Purchases Report');

    ws.columns = [
      { header: 'PO #',        key: 'referenceNo',  width: 18 },
      { header: 'Date',        key: 'date',         width: 14 },
      { header: 'Supplier',    key: 'supplier',     width: 24 },
      { header: 'Status',      key: 'status',       width: 12 },
      { header: 'Total',       key: 'total',        width: 14 },
      { header: 'Paid',        key: 'paid',         width: 14 },
      { header: 'Balance Due', key: 'due',          width: 14 },
    ];
    this.styleHeaderRow(ws, ws.columns.length);

    for (const p of purchases) {
      ws.addRow({
        referenceNo: (p as any).referenceNo ?? p.id,
        date: new Date((p as any).purchaseDate).toLocaleDateString(),
        supplier: (p as any).contact?.name ?? '—',
        status: p.status,
        total: Number(p.totalAmount),
        paid: Number(p.paidAmount ?? 0),
        due: Math.max(Number(p.totalAmount) - Number(p.paidAmount ?? 0), 0),
      });
    }
    ['total','paid','due'].forEach((key) => {
      ws.getColumn(key).numFmt = '"$"#,##0.00';
    });

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async exportStockExcel(businessId: number): Promise<Buffer> {
    const { products } = await this.getStockReport(businessId);
    const { wb, ws } = this.createWorkbook('Stock Report');

    ws.columns = [
      { header: 'SKU',          key: 'sku',          width: 16 },
      { header: 'Product',      key: 'name',         width: 32 },
      { header: 'Category',     key: 'category',     width: 18 },
      { header: 'Unit',         key: 'unit',         width: 10 },
      { header: 'Stock Qty',    key: 'qty',          width: 12 },
      { header: 'Alert Qty',    key: 'alert',        width: 12 },
      { header: 'Unit Cost',    key: 'cost',         width: 14 },
      { header: 'Total Value',  key: 'value',        width: 16 },
      { header: 'Status',       key: 'status',       width: 12 },
    ];
    this.styleHeaderRow(ws, ws.columns.length);

    for (const p of products) {
      const status =
        p.currentStock <= 0
          ? 'Out of Stock'
          : p.currentStock <= p.alertQuantity
            ? 'Low Stock'
            : 'In Stock';

      const row = ws.addRow({
        sku: p.sku,
        name: p.name,
        category: (p as any).category?.name ?? '—',
        unit: (p as any).unit?.shortName ?? 'PC',
        qty: p.currentStock,
        alert: p.alertQuantity,
        cost: p.unitCost,
        value: p.currentStock * p.unitCost,
        status,
      });

      // Colour-code the Status cell
      const statusCell = row.getCell('status');
      if (status === 'Out of Stock') {
        statusCell.font = { color: { argb: 'CC0000' }, bold: true };
      } else if (status === 'Low Stock') {
        statusCell.font = { color: { argb: 'E65100' }, bold: true };
      } else {
        statusCell.font = { color: { argb: '1B5E20' } };
      }
    }

    ['cost','value'].forEach((key) => {
      ws.getColumn(key).numFmt = '"$"#,##0.00';
    });

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  // ─── Expense Report ──────────────────────────────────────────────────────────

  async getExpenseReport(businessId: number, from?: string, to?: string) {
    const where: any = { businessId, deletedAt: null };
    if (from || to) {
      where.expenseDate = {};
      if (from) where.expenseDate.gte = new Date(from);
      if (to)   where.expenseDate.lte = new Date(to);
    }

    const [expenses, summary, byCategory] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.expense.aggregate({
        where,
        _sum: { amount: true, taxAmount: true, totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.expense.groupBy({
        by: ['expenseCategoryId'],
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
      }),
    ]);

    // Enrich category names
    const catIds = byCategory.map((r) => r.expenseCategoryId).filter(Boolean) as number[];
    const cats = catIds.length
      ? await this.prisma.expenseCategory.findMany({ where: { id: { in: catIds } } })
      : [];
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

    return {
      expenses,
      summary: {
        total: Number(summary._sum.totalAmount ?? 0),
        tax: Number(summary._sum.taxAmount ?? 0),
        net: Number(summary._sum.amount ?? 0),
        count: summary._count.id,
      },
      byCategory: byCategory.map((r) => ({
        categoryId: r.expenseCategoryId,
        categoryName: r.expenseCategoryId ? (catMap[r.expenseCategoryId] ?? 'Unknown') : 'Uncategorised',
        total: Number(r._sum.totalAmount ?? 0),
        count: r._count.id,
      })),
    };
  }

  // ─── Tax Report ──────────────────────────────────────────────────────────────

  async getTaxReport(businessId: number, from?: string, to?: string) {
    const saleWhere: any = { businessId, deletedAt: null };
    const purchaseWhere: any = { businessId, deletedAt: null };
    if (from || to) {
      const range: any = {};
      if (from) range.gte = new Date(from);
      if (to)   range.lte = new Date(to);
      saleWhere.transactionDate = range;
      purchaseWhere.purchaseDate = range;
    }

    const [saleTax, purchaseTax, expenseTax, saleCount, purchaseCount] =
      await Promise.all([
        this.prisma.sale.aggregate({
          where: saleWhere,
          _sum: { taxAmount: true, totalAmount: true },
          _count: { id: true },
        }),
        this.prisma.purchase.aggregate({
          where: purchaseWhere,
          _sum: { taxAmount: true, totalAmount: true },
          _count: { id: true },
        }),
        this.prisma.expense.aggregate({
          where: { ...saleWhere, expenseDate: saleWhere.transactionDate },
          _sum: { taxAmount: true },
        }),
        this.prisma.sale.count({ where: saleWhere }),
        this.prisma.purchase.count({ where: purchaseWhere }),
      ]);

    const taxCollected  = Number(saleTax._sum.taxAmount ?? 0);
    const taxPaid       = Number(purchaseTax._sum.taxAmount ?? 0) + Number(expenseTax._sum.taxAmount ?? 0);
    const netTaxLiability = taxCollected - taxPaid;

    return {
      taxCollected,
      taxPaid,
      netTaxLiability,
      salesCount: saleCount,
      purchasesCount: purchaseCount,
      totalSalesRevenue: Number(saleTax._sum.totalAmount ?? 0),
      totalPurchasesCost: Number(purchaseTax._sum.totalAmount ?? 0),
    };
  }

  // ─── Profit & Loss ───────────────────────────────────────────────────────────

  async getProfitLoss(businessId: number, from?: string, to?: string) {
    const saleWhere: any    = { businessId, deletedAt: null };
    const purchaseWhere: any = { businessId, deletedAt: null };
    const expenseWhere: any  = { businessId, deletedAt: null };

    if (from || to) {
      const range: any = {};
      if (from) range.gte = new Date(from);
      if (to)   range.lte = new Date(to);
      saleWhere.transactionDate    = range;
      purchaseWhere.purchaseDate   = range;
      expenseWhere.expenseDate     = range;
    }

    const [revenue, cogs, expenses] = await Promise.all([
      this.prisma.sale.aggregate({
        where: saleWhere,
        _sum: { totalAmount: true, discountAmount: true, taxAmount: true },
      }),
      this.prisma.purchase.aggregate({
        where: purchaseWhere,
        _sum: { totalAmount: true },
      }),
      this.prisma.expense.aggregate({
        where: expenseWhere,
        _sum: { totalAmount: true },
      }),
    ]);

    const grossRevenue     = Number(revenue._sum.totalAmount ?? 0);
    const totalCOGS        = Number(cogs._sum.totalAmount ?? 0);
    const totalExpenses    = Number(expenses._sum.totalAmount ?? 0);
    const grossProfit      = grossRevenue - totalCOGS;
    const netProfit        = grossProfit - totalExpenses;
    const grossMarginPct   = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    const netMarginPct     = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return {
      grossRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      grossMarginPct: Math.round(grossMarginPct * 100) / 100,
      netMarginPct:   Math.round(netMarginPct * 100) / 100,
    };
  }

  // ─── Customer Sales History ──────────────────────────────────────────────────

  async getCustomerReport(businessId: number, contactId: number) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, businessId },
    });

    const [sales, summary] = await Promise.all([
      this.prisma.sale.findMany({
        where: { businessId, contactId, deletedAt: null },
        orderBy: { transactionDate: 'desc' },
        take: 50,
        include: {
          lines: { select: { id: true, quantity: true, unitPrice: true, lineTotal: true } },
        },
      }),
      this.prisma.sale.aggregate({
        where: { businessId, contactId, deletedAt: null },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true },
      }),
    ]);

    const totalDue = Number(summary._sum.totalAmount ?? 0) - Number(summary._sum.paidAmount ?? 0);

    return {
      contact,
      sales,
      summary: {
        totalOrders: summary._count.id,
        totalRevenue: Number(summary._sum.totalAmount ?? 0),
        totalPaid: Number(summary._sum.paidAmount ?? 0),
        totalDue: Math.max(totalDue, 0),
      },
    };
  }

  // ─── Supplier Purchase History ───────────────────────────────────────────────

  async getSupplierReport(businessId: number, contactId: number) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, businessId },
    });

    const [purchases, summary] = await Promise.all([
      this.prisma.purchase.findMany({
        where: { businessId, contactId, deletedAt: null },
        orderBy: { purchaseDate: 'desc' },
        take: 50,
        include: {
          lines: { select: { id: true, quantity: true, unitCostAfter: true, lineTotal: true } },
        },
      }),
      this.prisma.purchase.aggregate({
        where: { businessId, contactId, deletedAt: null },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true },
      }),
    ]);

    const totalDue = Number(summary._sum.totalAmount ?? 0) - Number(summary._sum.paidAmount ?? 0);

    return {
      contact,
      purchases,
      summary: {
        totalOrders: summary._count.id,
        totalSpend: Number(summary._sum.totalAmount ?? 0),
        totalPaid: Number(summary._sum.paidAmount ?? 0),
        totalDue: Math.max(totalDue, 0),
      },
    };
  }

  // ─── PDF Export ──────────────────────────────────────────────────────────────

  private buildPdf(
    title: string,
    subtitle: string,
    headers: string[],
    colWidths: number[],
    rows: string[][],
    summaryLines?: string[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 80; // left + right margin

      // ── Header ──────────────────────────────────────────────────────────────
      doc.rect(40, 30, pageWidth, 42).fill('#3F51B5');
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(title, 50, 38, { width: pageWidth - 20 });
      doc.fillColor('#ccd3ff').fontSize(9).font('Helvetica').text(subtitle, 50, 57, { width: pageWidth - 20 });
      doc.fillColor('#111827');

      // ── Column header row ────────────────────────────────────────────────────
      const tableTop = 90;
      const rowH = 20;

      // Calculate actual widths
      const totalW = colWidths.reduce((a, b) => a + b, 0);
      const scaledWidths = colWidths.map((w) => (w / totalW) * pageWidth);

      doc.rect(40, tableTop, pageWidth, rowH).fill('#e8eaf6');
      doc.fillColor('#1a237e').fontSize(9).font('Helvetica-Bold');
      let xPos = 40;
      headers.forEach((h, i) => {
        doc.text(h, xPos + 4, tableTop + 6, { width: scaledWidths[i] - 8, align: i > 0 ? 'right' : 'left' });
        xPos += scaledWidths[i];
      });

      // ── Data rows ────────────────────────────────────────────────────────────
      doc.font('Helvetica').fontSize(8).fillColor('#111827');
      let y = tableTop + rowH;
      rows.forEach((row, ri) => {
        if (y + rowH > doc.page.height - 60) {
          doc.addPage();
          y = 40;
        }
        if (ri % 2 === 0) doc.rect(40, y, pageWidth, rowH).fill('#fafafa');
        doc.rect(40, y, pageWidth, rowH).stroke('#e5e7eb');
        doc.fillColor('#111827');
        xPos = 40;
        row.forEach((cell, i) => {
          doc.text(cell ?? '', xPos + 4, y + 6, { width: scaledWidths[i] - 8, align: i > 0 ? 'right' : 'left' });
          xPos += scaledWidths[i];
        });
        y += rowH;
      });

      // ── Summary ──────────────────────────────────────────────────────────────
      if (summaryLines?.length) {
        y += 10;
        if (y + summaryLines.length * 16 > doc.page.height - 40) {
          doc.addPage();
          y = 40;
        }
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a237e');
        summaryLines.forEach((line) => {
          doc.text(line, 40, y, { width: pageWidth });
          y += 16;
        });
      }

      // ── Footer ───────────────────────────────────────────────────────────────
      doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
        .text(`Generated on ${new Date().toLocaleString()}`, 40, doc.page.height - 30, {
          width: pageWidth, align: 'center',
        });

      doc.end();
    });
  }

  async exportSalesPdf(businessId: number, from?: string, to?: string): Promise<Buffer> {
    const { sales, summary } = await this.getSalesReport(businessId, from, to);
    const subtitle = from || to ? `Period: ${from ?? '—'} to ${to ?? '—'}` : 'All time';

    const headers = ['Invoice #', 'Date', 'Customer', 'Status', 'Total', 'Paid', 'Due'];
    const colWidths = [14, 10, 22, 10, 11, 11, 11];
    const rows = (sales as any[]).map((s) => [
      String(s.invoiceNo ?? s.id),
      s.transactionDate ? new Date(s.transactionDate).toLocaleDateString() : '—',
      s.contact?.name ?? 'Walk-in',
      s.paymentStatus ?? s.status ?? '—',
      `$${Number(s.totalAmount).toFixed(2)}`,
      `$${Number(s.paidAmount ?? 0).toFixed(2)}`,
      `$${Math.max(Number(s.totalAmount) - Number(s.paidAmount ?? 0), 0).toFixed(2)}`,
    ]);

    const summaryLines = [
      `Orders: ${summary?._count?.id ?? rows.length}`,
      `Revenue: $${Number(summary?._sum?.totalAmount ?? 0).toFixed(2)}`,
      `Paid: $${Number(summary?._sum?.paidAmount ?? 0).toFixed(2)}`,
    ];

    return this.buildPdf('Sales Report', subtitle, headers, colWidths, rows, summaryLines);
  }

  async exportPurchasesPdf(businessId: number, from?: string, to?: string): Promise<Buffer> {
    const { purchases, summary } = await this.getPurchasesReport(businessId, from, to);
    const subtitle = from || to ? `Period: ${from ?? '—'} to ${to ?? '—'}` : 'All time';

    const headers = ['Reference #', 'Date', 'Supplier', 'Status', 'Total', 'Paid', 'Due'];
    const colWidths = [14, 10, 24, 10, 11, 11, 11];
    const rows = (purchases as any[]).map((p) => [
      String(p.referenceNo ?? p.id),
      p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '—',
      p.contact?.name ?? '—',
      p.paymentStatus ?? p.status ?? '—',
      `$${Number(p.totalAmount).toFixed(2)}`,
      `$${Number(p.paidAmount ?? 0).toFixed(2)}`,
      `$${Math.max(Number(p.totalAmount) - Number(p.paidAmount ?? 0), 0).toFixed(2)}`,
    ]);

    const summaryLines = [
      `Orders: ${summary?._count?.id ?? rows.length}`,
      `Total Spend: $${Number(summary?._sum?.totalAmount ?? 0).toFixed(2)}`,
    ];

    return this.buildPdf('Purchases Report', subtitle, headers, colWidths, rows, summaryLines);
  }

  async exportStockPdf(businessId: number): Promise<Buffer> {
    const { products, totalProducts, totalValue } = await this.getStockReport(businessId);

    const headers = ['SKU', 'Product', 'Category', 'Unit', 'Stock', 'Alert', 'Value', 'Status'];
    const colWidths = [12, 25, 15, 8, 8, 8, 12, 10];
    const rows = (products as any[]).map((p) => {
      const status = p.currentStock <= 0 ? 'Out' : p.currentStock <= (p.alertQuantity ?? 5) ? 'Low' : 'OK';
      return [
        p.sku ?? '—',
        p.name,
        p.category?.name ?? '—',
        p.unit?.shortName ?? 'PC',
        String(p.currentStock ?? 0),
        String(p.alertQuantity ?? 5),
        `$${(p.currentStock * p.unitCost).toFixed(2)}`,
        status,
      ];
    });

    const summaryLines = [
      `Total Products: ${totalProducts}`,
      `Total Stock Value: $${Number(totalValue).toFixed(2)}`,
    ];

    return this.buildPdf('Stock Report', `As of ${new Date().toLocaleDateString()}`, headers, colWidths, rows, summaryLines);
  }

  async exportExpensesPdf(businessId: number, from?: string, to?: string): Promise<Buffer> {
    const { expenses, summary, byCategory } = await this.getExpenseReport(businessId, from, to);
    const subtitle = from || to ? `Period: ${from ?? '—'} to ${to ?? '—'}` : 'All time';

    const headers = ['Date', 'Category', 'Note', 'Net', 'Tax', 'Total'];
    const colWidths = [12, 18, 30, 13, 13, 13];
    const rows = (expenses as any[]).map((e) => [
      e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : '—',
      e.category?.name ?? 'Uncategorised',
      e.note ?? e.description ?? '—',
      `$${Number(e.amount ?? 0).toFixed(2)}`,
      `$${Number(e.taxAmount ?? 0).toFixed(2)}`,
      `$${Number(e.totalAmount ?? 0).toFixed(2)}`,
    ]);

    const summaryLines = [
      `Transactions: ${summary?.count ?? rows.length}`,
      `Net: $${Number(summary?.net ?? 0).toFixed(2)}`,
      `Tax: $${Number(summary?.tax ?? 0).toFixed(2)}`,
      `Total: $${Number(summary?.total ?? 0).toFixed(2)}`,
    ];

    // Append by-category breakdown
    if ((byCategory as any[]).length) {
      summaryLines.push('');
      summaryLines.push('By Category:');
      (byCategory as any[]).forEach((c) =>
        summaryLines.push(`  ${c.categoryName}: $${Number(c.total).toFixed(2)} (${c.count} txn)`),
      );
    }

    return this.buildPdf('Expense Report', subtitle, headers, colWidths, rows, summaryLines);
  }

  async exportProfitLossPdf(businessId: number, from?: string, to?: string): Promise<Buffer> {
    const pl = await this.getProfitLoss(businessId, from, to);
    const subtitle = from || to ? `Period: ${from ?? '—'} to ${to ?? '—'}` : 'All time';

    // P&L is a structured statement, not a table of rows — render as key/value pairs
    const headers = ['Item', 'Amount'];
    const colWidths = [60, 40];
    const rows: string[][] = [
      ['INCOME', ''],
      ['Gross Revenue', `$${pl.grossRevenue.toFixed(2)}`],
      ['', ''],
      ['COST OF GOODS SOLD', ''],
      ['Purchase Cost (COGS)', `($${pl.totalCOGS.toFixed(2)})`],
      ['', ''],
      ['Gross Profit', `$${pl.grossProfit.toFixed(2)}`],
      [`Gross Margin`, `${pl.grossMarginPct.toFixed(1)}%`],
      ['', ''],
      ['OPERATING EXPENSES', ''],
      ['Total Expenses', `($${pl.totalExpenses.toFixed(2)})`],
      ['', ''],
      ['Net Profit', `$${pl.netProfit.toFixed(2)}`],
      ['Net Margin', `${pl.netMarginPct.toFixed(1)}%`],
    ];

    return this.buildPdf('Profit & Loss Statement', subtitle, headers, colWidths, rows);
  }
}

