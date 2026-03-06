import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

export interface CreateScheduledReportDto {
  name: string;
  reportType: 'sales_summary' | 'profit_loss' | 'inventory' | 'expenses' | 'contacts';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
}

export interface UpdateScheduledReportDto {
  name?: string;
  reportType?: string;
  frequency?: string;
  recipients?: string[];
  isActive?: boolean;
}

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(businessId: number, userId: number, dto: CreateScheduledReportDto) {
    const nextRunAt = this.calcNextRun(dto.frequency);
    return this.prisma.scheduledReport.create({
      data: {
        businessId,
        createdBy: userId,
        name: dto.name,
        reportType: dto.reportType,
        frequency: dto.frequency,
        recipients: dto.recipients,
        nextRunAt,
      },
    });
  }

  findAll(businessId: number) {
    return this.prisma.scheduledReport.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: number, id: number) {
    const row = await this.prisma.scheduledReport.findFirst({ where: { id, businessId } });
    if (!row) throw new NotFoundException(`Scheduled report ${id} not found`);
    return row;
  }

  async update(businessId: number, id: number, dto: UpdateScheduledReportDto) {
    await this.findOne(businessId, id);
    const data: any = { ...dto };
    if (dto.frequency) {
      data.nextRunAt = this.calcNextRun(dto.frequency);
    }
    return this.prisma.scheduledReport.update({ where: { id }, data });
  }

  async remove(businessId: number, id: number) {
    await this.findOne(businessId, id);
    await this.prisma.scheduledReport.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Cron runners ─────────────────────────────────────────────────────────

  /** Check every hour for daily/weekly/monthly reports that are due. */
  @Cron(CronExpression.EVERY_HOUR)
  async runDueReports(): Promise<void> {
    const now = new Date();
    const due = await this.prisma.scheduledReport.findMany({
      where: { isActive: true, nextRunAt: { lte: now } },
    });

    for (const report of due) {
      try {
        await this.executeReport(report);
        await this.prisma.scheduledReport.update({
          where: { id: report.id },
          data: {
            lastRunAt: now,
            nextRunAt: this.calcNextRun(report.frequency),
          },
        });
      } catch (err: any) {
        this.logger.error(`Scheduled report ${report.id} (${report.name}) failed: ${err?.message}`);
      }
    }
  }

  // ─── Report execution ─────────────────────────────────────────────────────

  private async executeReport(report: {
    id: number;
    businessId: number;
    name: string;
    reportType: string;
    frequency: string;
    recipients: any;
  }): Promise<void> {
    const html = await this.buildReportHtml(report.businessId, report.reportType, report.frequency);
    const recipients: string[] = Array.isArray(report.recipients) ? report.recipients : [];
    if (!recipients.length) return;

    await this.sendReportEmail(
      recipients,
      `[Ultimate POS] Scheduled Report: ${report.name}`,
      html,
    );
    this.logger.log(`Sent scheduled report "${report.name}" (id=${report.id}) to ${recipients.join(', ')}`);
  }

  private async buildReportHtml(businessId: number, reportType: string, frequency: string): Promise<string> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, currency: true },
    });

    const periodLabel = frequency === 'daily' ? 'Yesterday' : frequency === 'weekly' ? 'Last 7 days' : 'Last 30 days';
    const since = new Date();
    since.setDate(since.getDate() - (frequency === 'monthly' ? 30 : frequency === 'weekly' ? 7 : 1));

    let bodyHtml = '';

    if (reportType === 'sales_summary') {
      const [totalResult, countResult] = await Promise.all([
        this.prisma.sale.aggregate({
          where: { businessId, createdAt: { gte: since } },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        this.prisma.sale.count({ where: { businessId, status: 'completed', createdAt: { gte: since } } }),
      ]);
      const total = Number(totalResult._sum.totalAmount ?? 0).toFixed(2);
      bodyHtml = `
        <h3>Sales Summary — ${periodLabel}</h3>
        <table style="border-collapse:collapse;width:100%">
          <tr style="background:#f3f4f6"><th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Metric</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:right">Value</th></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb">Total Sales</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${totalResult._count.id}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb">Completed Sales</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${countResult}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb">Revenue (${business?.currency ?? 'USD'})</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${total}</td></tr>
        </table>`;
    } else if (reportType === 'expenses') {
      const result = await this.prisma.expense.aggregate({
        where: { businessId, createdAt: { gte: since } },
        _sum: { amount: true },
        _count: { id: true },
      });
      bodyHtml = `
        <h3>Expenses — ${periodLabel}</h3>
        <table style="border-collapse:collapse;width:100%">
          <tr style="background:#f3f4f6"><th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Metric</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:right">Value</th></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb">Total Expenses</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${result._count.id}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb">Total Amount (${business?.currency ?? 'USD'})</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${Number(result._sum.amount ?? 0).toFixed(2)}</td></tr>
        </table>`;
    } else if (reportType === 'inventory') {
      const lowCount = await this.prisma.product.count({
        where: { businessId, enableStock: true },
      });
      bodyHtml = `
        <h3>Inventory Snapshot — ${periodLabel}</h3>
        <p>Total tracked products: <strong>${lowCount}</strong></p>
        <p>Visit the Inventory section for detailed stock levels.</p>`;
    } else if (reportType === 'contacts') {
      const count = await this.prisma.contact.count({
        where: { businessId, createdAt: { gte: since } },
      });
      bodyHtml = `<h3>New Contacts — ${periodLabel}</h3><p>New contacts added: <strong>${count}</strong></p>`;
    } else {
      bodyHtml = `<p>Report type <em>${reportType}</em> data is available in the dashboard.</p>`;
    }

    return `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
        <h2 style="color:#1d4ed8">${business?.name ?? 'Ultimate POS'} — Scheduled Report</h2>
        ${bodyHtml}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#6b7280;font-size:12px">This is an automated report from Ultimate POS. <a href="${this.config.get('FRONTEND_URL', 'http://localhost:4200')}/reports">View full reports</a></p>
      </div>`;
  }

  private async sendReportEmail(to: string[], subject: string, html: string): Promise<void> {
    const host = this.config.get<string>('MAIL_HOST');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS') || this.config.get<string>('SENDGRID_API_KEY');
    const port = Number(this.config.get<string>('MAIL_PORT', '587'));
    const from = this.config.get<string>('MAIL_FROM', user ?? 'noreply@example.com');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured — skipping scheduled report email');
      return;
    }

    const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
    await transporter.sendMail({ from, to: to.join(','), subject, html });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private calcNextRun(frequency: string): Date {
    const d = new Date();
    if (frequency === 'daily') d.setDate(d.getDate() + 1);
    else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    d.setHours(6, 0, 0, 0); // 06:00
    return d;
  }
}
