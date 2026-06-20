import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ExportService } from './export.service';
import { ReportingService } from './reporting.service';
import { CreateScheduledReportDto } from './dto/create-scheduled-report.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ScheduledReportService {
  private readonly logger = new Logger(ScheduledReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly exportService: ExportService,
    private readonly reportingService: ReportingService,
  ) {}

  // ─── CRUD Operations ──────────────────────────────────────────────────────

  async create(businessId: number, createdBy: number, dto: CreateScheduledReportDto) {
    const nextRunAt = this.calcNextRunAt(dto.frequency);
    return this.prisma.scheduledReport.create({
      data: {
        businessId,
        createdBy,
        name: dto.name,
        reportType: dto.reportType,
        frequency: dto.frequency,
        recipients: dto.recipients,
        nextRunAt,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(businessId: number) {
    return this.prisma.scheduledReport.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: number, id: number) {
    const report = await this.prisma.scheduledReport.findFirst({
      where: { id, businessId },
    });
    if (!report) {
      throw new NotFoundException(`Scheduled report #${id} not found`);
    }
    return report;
  }

  async remove(businessId: number, id: number) {
    await this.findOne(businessId, id);
    return this.prisma.scheduledReport.delete({
      where: { id },
    });
  }

  async runReportManually(businessId: number, id: number) {
    const report = await this.findOne(businessId, id);
    await this.processReport(report);
    return { success: true, message: `Report "${report.name}" executed successfully.` };
  }

  // ─── Background cron execution ───────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledReports() {
    const now = new Date();
    const reports = await this.prisma.scheduledReport.findMany({
      where: {
        isActive: true,
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
      },
    });

    for (const report of reports) {
      try {
        await this.processReport(report);
        await this.prisma.scheduledReport.update({
          where: { id: report.id },
          data: {
            lastRunAt: now,
            nextRunAt: this.calcNextRunAt(report.frequency),
          },
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to execute scheduled report #${report.id}: ${errMsg}`);
      }
    }
  }

  // ─── Core Report Processor & Mailer ──────────────────────────────────────

  async getReportData(
    businessId: number,
    reportType: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<{
    headers: string[];
    colWidths: number[];
    rows: string[][];
    summaryLines?: string[];
  }> {
    const end = toDate ?? new Date();
    const start = fromDate ?? new Date();
    if (!fromDate) {
      start.setDate(start.getDate() - 30);
    }

    let headers: string[] = [];
    let rows: string[][] = [];
    let colWidths: number[] = [];
    let summaryLines: string[] = [];

    if (reportType === 'sales_summary') {
      const salesData = await this.reportingService.getSalesReport(businessId, start, end);
      headers = [
        'Invoice No',
        'Date',
        'Customer',
        'Status',
        'Payment Status',
        'Total Amount',
        'Paid Amount',
      ];
      colWidths = [15, 20, 20, 10, 15, 15, 15];
      rows = salesData.sales.map((s) => [
        s.invoiceNo,
        s.transactionDate.toISOString().split('T')[0],
        s.contact?.name ?? 'Walk-In',
        s.status,
        s.paymentStatus,
        s.totalAmount.toFixed(2),
        s.paidAmount.toFixed(2),
      ]);
      summaryLines = [
        `Total Sales: ${salesData.summary.salesCount}`,
        `Total Revenue: ${salesData.summary.totalAmount.toFixed(2)}`,
        `Total Paid: ${salesData.summary.totalPaid.toFixed(2)}`,
        `Total Due: ${salesData.summary.totalDue.toFixed(2)}`,
      ];
    } else if (reportType === 'profit_loss') {
      // Sales revenue
      const salesAgg = await this.prisma.sale.aggregate({
        where: {
          businessId,
          deletedAt: null,
          type: 'sale',
          status: 'final',
          transactionDate: { gte: start, lte: end },
        },
        _sum: { totalAmount: true },
      });
      const revenue = Number(salesAgg._sum.totalAmount ?? 0);

      // COGS using FIFO
      const saleLines = await this.prisma.saleLine.findMany({
        where: {
          sale: {
            businessId,
            deletedAt: null,
            type: 'sale',
            status: 'final',
            transactionDate: { gte: start, lte: end },
          },
        },
        include: {
          sellLinesPurchaseLines: { include: { purchaseLine: true } },
        },
      });
      let totalCogs = 0;
      for (const line of saleLines) {
        if (line.sellLinesPurchaseLines) {
          for (const m of line.sellLinesPurchaseLines) {
            totalCogs += Number(m.quantity ?? 0) * Number(m.purchaseLine?.unitCostAfter ?? 0);
          }
        }
      }

      // Expenses
      const expensesAgg = await this.prisma.expense.aggregate({
        where: { businessId, deletedAt: null, expenseDate: { gte: start, lte: end } },
        _sum: { totalAmount: true },
      });
      const expenses = Number(expensesAgg._sum.totalAmount ?? 0);
      const netProfit = revenue - totalCogs - expenses;

      headers = ['Metric Category', 'Amount'];
      colWidths = [30, 20];
      rows = [
        ['Total Sales Revenue', revenue.toFixed(2)],
        ['Cost of Goods Sold (COGS)', totalCogs.toFixed(2)],
        ['Total Expenses', expenses.toFixed(2)],
        ['Net Profit', netProfit.toFixed(2)],
      ];
    } else if (reportType === 'inventory') {
      const stockData = await this.reportingService.getStockReport(businessId);
      headers = ['Product Name', 'SKU', 'Sub SKU', 'Qty Available', 'Unit Cost', 'Valuation'];
      colWidths = [25, 12, 12, 15, 12, 15];
      rows = stockData.map((s) => [
        s.productName,
        s.sku,
        s.subSku ?? '',
        s.qtyAvailable.toString(),
        s.unitCost.toFixed(2),
        s.valuation.toFixed(2),
      ]);
    } else if (reportType === 'expenses') {
      const expenses = await this.prisma.expense.findMany({
        where: { businessId, deletedAt: null, expenseDate: { gte: start, lte: end } },
        orderBy: { expenseDate: 'desc' },
      });
      headers = ['Ref No', 'Date', 'Amount', 'Tax Amount', 'Total Amount', 'Note'];
      colWidths = [15, 15, 12, 12, 12, 25];
      rows = expenses.map((e) => [
        e.refNo ?? '',
        e.expenseDate.toISOString().split('T')[0],
        e.amount.toFixed(2),
        e.taxAmount.toFixed(2),
        e.totalAmount.toFixed(2),
        e.note ?? '',
      ]);
    } else if (reportType === 'contacts') {
      const contacts = await this.prisma.contact.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { name: 'asc' },
      });
      headers = ['Name', 'Type', 'Email', 'Mobile', 'Status', 'Balance'];
      colWidths = [20, 12, 20, 15, 12, 15];
      rows = contacts.map((c) => [
        c.name,
        c.type,
        c.email ?? '',
        c.mobile,
        c.contactStatus,
        Number(c.balance).toFixed(2),
      ]);
    }

    return { headers, colWidths, rows, summaryLines };
  }

  async processReport(report: {
    id: number;
    businessId: number;
    reportType: string;
    frequency: string;
    name: string;
    recipients: any;
  }) {
    const businessId = Number(report.businessId);
    const reportType = String(report.reportType);
    const frequency = String(report.frequency);
    const nameStr = String(report.name);

    const toDate = new Date();
    const fromDate = new Date();
    if (frequency === 'daily') {
      fromDate.setDate(fromDate.getDate() - 1);
    } else if (frequency === 'weekly') {
      fromDate.setDate(fromDate.getDate() - 7);
    } else {
      fromDate.setMonth(fromDate.getMonth() - 1);
    }

    const { headers, colWidths, rows, summaryLines } = await this.getReportData(
      businessId,
      reportType,
      fromDate,
      toDate,
    );

    // 2. Generate PDF and Excel Buffers
    const subtitle = `Period: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`;
    const pdfBuffer = await this.exportService.exportToPDF(
      nameStr,
      subtitle,
      headers,
      colWidths,
      rows,
      summaryLines,
    );
    const excelBuffer = await this.exportService.exportToExcel(nameStr, headers, rows);

    // 3. Mail Setup
    const recipientsRaw = report.recipients as unknown;
    let emails: string[] = [];
    if (Array.isArray(recipientsRaw)) {
      emails = recipientsRaw.map(String);
    } else if (typeof recipientsRaw === 'string') {
      try {
        emails = JSON.parse(recipientsRaw) as string[];
      } catch {
        emails = [];
      }
    }
    if (emails.length === 0) {
      return;
    }

    const host = this.config.get<string>('MAIL_HOST');
    const port = Number(this.config.get<string>('MAIL_PORT', '587'));
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');
    const from = this.config.get<string>('MAIL_FROM', user ?? 'noreply@ultimatepos.com');

    const subject = `[Scheduled Report] ${nameStr}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #3F51B5; margin-bottom: 4px;">Ultimate POS Scheduled Report</h2>
        <p style="color: #718096; font-size: 14px; margin-top: 0;">Report: <strong>${nameStr}</strong> (${reportType})</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 16px 0;" />
        <p style="font-size: 15px; color: #2d3748;">
          Your scheduled report for <strong>${frequency}</strong> is attached below in both PDF and Excel formats.
        </p>
        <p style="font-size: 14px; color: #4a5568; margin-top: 24px;">
          Best Regards,<br />
          Ultimate POS Automation System
        </p>
      </div>
    `;

    if (!host || !user || !pass) {
      // SMTP not configured - simulate sending by logging report metadata and transmission
      this.logger.log(`[SIMULATED EMAIL] Send to: ${emails.join(', ')}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(
        `Attachments: [${nameStr}.pdf (${pdfBuffer.length} bytes), ${nameStr}.xlsx (${excelBuffer.length} bytes)]`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from,
        to: emails.join(', '),
        subject,
        html: htmlBody,
        attachments: [
          {
            filename: `${nameStr.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
          },
          {
            filename: `${nameStr.replace(/\s+/g, '_')}.xlsx`,
            content: excelBuffer,
          },
        ],
      });
      this.logger.log(`Email successfully sent for report "${nameStr}" to: ${emails.join(', ')}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error sending report email: ${errMsg}`);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private calcNextRunAt(frequency: string): Date {
    const d = new Date();
    if (frequency === 'daily') d.setDate(d.getDate() + 1);
    else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    d.setHours(6, 0, 0, 0); // 06:00 AM local time
    return d;
  }
}
