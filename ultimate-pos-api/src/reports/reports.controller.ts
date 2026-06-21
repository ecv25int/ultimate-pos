import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Param,
  ParseIntPipe,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { AgingService } from './aging.service';
import { ExportReportDto, ReportType, ExportFormat } from './dto/export-report.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly agingService: AgingService,
  ) {}

  /** GET /api/reports/dashboard */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard KPIs',
    description:
      'Returns today revenue, monthly totals, low-stock count, and top 5 products. Cached 5 min.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard summary object.' })
  getDashboard(@Request() req: any) {
    return this.reportsService.getDashboard(req.user.businessId);
  }

  /** GET /api/reports/sales?from=&to= */
  @Get('sales')
  @ApiOperation({
    summary: 'Sales report',
    description: 'Aggregated sales totals, counts, and top products for the date range.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date, e.g. 2025-01-01' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date, e.g. 2025-12-31' })
  @ApiResponse({ status: 200, description: 'Sales report object.' })
  getSales(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getSalesReport(req.user.businessId, from, to);
  }

  /** GET /api/reports/purchases?from=&to= */
  @Get('purchases')
  @ApiOperation({
    summary: 'Purchases report',
    description: 'Aggregated purchase totals and counts for the date range.',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Purchases report object.' })
  getPurchases(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getPurchasesReport(req.user.businessId, from, to);
  }

  /** GET /api/reports/stock */
  @Get('stock')
  @ApiOperation({
    summary: 'Stock report',
    description: 'Current stock levels for all products, with low-stock flag.',
  })
  @ApiResponse({ status: 200, description: 'Array of stock entries per product.' })
  getStock(@Request() req: any) {
    return this.reportsService.getStockReport(req.user.businessId);
  }

  /** GET /api/reports/top-products?limit= */
  @Get('top-products')
  @ApiOperation({ summary: 'Top products by revenue' })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of products to return (default 10)',
  })
  @ApiResponse({ status: 200, description: 'Array of top products.' })
  getTopProducts(@Request() req: any, @Query('limit') limit?: string) {
    return this.reportsService.getTopProducts(
      req.user.businessId,
      limit ? Math.min(+limit, 100) : 10,
    );
  }

  /** GET /api/reports/revenue?groupBy=day|month&days=30 */
  @Get('revenue')
  @ApiOperation({
    summary: 'Revenue over time',
    description: 'Returns daily or monthly revenue totals for charting.',
  })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'month'] })
  @ApiQuery({
    name: 'days',
    required: false,
    example: 30,
    description: 'Number of days to look back',
  })
  @ApiResponse({ status: 200, description: 'Array of { date, revenue } data points.' })
  getRevenue(
    @Request() req: any,
    @Query('groupBy') groupBy: 'day' | 'month' = 'day',
    @Query('days') days?: string,
  ) {
    return this.reportsService.getRevenueByPeriod(req.user.businessId, groupBy, days ? +days : 30);
  }

  /** GET /api/reports/expenses?from=&to= */
  @Get('expenses')
  @ApiOperation({
    summary: 'Expense report',
    description: 'Total expenses grouped by category for the date range.',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Expense report object.' })
  getExpenses(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getExpenseReport(req.user.businessId, from, to);
  }

  /** GET /api/reports/tax?from=&to= */
  @Get('tax')
  @ApiOperation({
    summary: 'Tax report',
    description: 'Tax collected on sales and paid on purchases for the date range.',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Tax report object.' })
  getTax(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getTaxReport(req.user.businessId, from, to);
  }

  /** GET /api/reports/profit-loss?from=&to= */
  @Get('profit-loss')
  @ApiOperation({
    summary: 'Profit & Loss report',
    description:
      'Revenue minus COGS and expenses for the date range. Includes gross and net margin percentages.',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({
    status: 200,
    description: 'P&L report with grossProfit, netProfit, grossMargin, netMargin.',
  })
  getProfitLoss(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getProfitLoss(req.user.businessId, from, to);
  }

  /** GET /api/reports/customer/:id */
  @Get('customer/:id')
  @ApiOperation({ summary: 'Customer sales history' })
  @ApiParam({ name: 'id', description: 'Contact (customer) ID' })
  @ApiResponse({ status: 200, description: 'All sales for this customer.' })
  getCustomerReport(@Request() req: any, @Param('id', ParseIntPipe) contactId: number) {
    return this.reportsService.getCustomerReport(req.user.businessId, contactId);
  }

  /** GET /api/reports/supplier/:id */
  @Get('supplier/:id')
  @ApiOperation({ summary: 'Supplier purchase history' })
  @ApiParam({ name: 'id', description: 'Contact (supplier) ID' })
  @ApiResponse({ status: 200, description: 'All purchases from this supplier.' })
  getSupplierReport(@Request() req: any, @Param('id', ParseIntPipe) contactId: number) {
    return this.reportsService.getSupplierReport(req.user.businessId, contactId);
  }

  /** GET /api/reports/export?type=sales|purchases|stock&from=&to= */
  @Get('export')
  @ApiOperation({
    summary: 'Export report to Excel',
    description: 'Downloads sales, purchases, or stock report as .xlsx file.',
  })
  @ApiQuery({ name: 'type', enum: ['sales', 'purchases', 'stock'], required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Excel file download.' })
  async exportReport(
    @Request() req: any,
    @Res() res: Response,
    @Query('type') type: 'sales' | 'purchases' | 'stock' = 'sales',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    let buffer: Buffer;
    let filename: string;

    if (type === 'purchases') {
      buffer = await this.reportsService.exportPurchasesExcel(req.user.businessId, from, to);
      filename = 'purchases-report.xlsx';
    } else if (type === 'stock') {
      buffer = await this.reportsService.exportStockExcel(req.user.businessId);
      filename = 'stock-report.xlsx';
    } else {
      buffer = await this.reportsService.exportSalesExcel(req.user.businessId, from, to);
      filename = 'sales-report.xlsx';
    }

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  /** GET /api/reports/export-pdf?type=sales|purchases|stock|expenses|profit-loss&from=&to= */
  @Get('export-pdf')
  @ApiOperation({
    summary: 'Export report to PDF',
    description: 'Downloads sales, purchases, stock, expenses, or P&L report as a .pdf file.',
  })
  @ApiQuery({
    name: 'type',
    enum: ['sales', 'purchases', 'stock', 'expenses', 'profit-loss'],
    required: false,
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'PDF file download.' })
  async exportReportPdf(
    @Request() req: any,
    @Res() res: Response,
    @Query('type') type: 'sales' | 'purchases' | 'stock' | 'expenses' | 'profit-loss' = 'sales',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    let buffer: Buffer;
    let filename: string;

    if (type === 'purchases') {
      buffer = await this.reportsService.exportPurchasesPdf(req.user.businessId, from, to);
      filename = 'purchases-report.pdf';
    } else if (type === 'stock') {
      buffer = await this.reportsService.exportStockPdf(req.user.businessId);
      filename = 'stock-report.pdf';
    } else if (type === 'expenses') {
      buffer = await this.reportsService.exportExpensesPdf(req.user.businessId, from, to);
      filename = 'expenses-report.pdf';
    } else if (type === 'profit-loss') {
      buffer = await this.reportsService.exportProfitLossPdf(req.user.businessId, from, to);
      filename = 'profit-loss-report.pdf';
    } else {
      buffer = await this.reportsService.exportSalesPdf(req.user.businessId, from, to);
      filename = 'sales-report.pdf';
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  /** GET /api/reports/trial-balance?asOfDate= */
  @Get('trial-balance')
  @ApiOperation({
    summary: 'Trial Balance',
    description:
      'Returns all accounts with hierarchical debits, credits, and balances. Validates that root debits match root credits.',
  })
  @ApiQuery({ name: 'asOfDate', required: false, description: 'ISO date, e.g. 2025-12-31' })
  @ApiResponse({ status: 200, description: 'Trial balance report.' })
  getTrialBalance(
    @Request() req: { user: { businessId: number } },
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.reportsService.getTrialBalance(req.user.businessId, asOfDate);
  }

  /** GET /api/reports/balance-sheet?asOfDate= */
  @Get('balance-sheet')
  @ApiOperation({
    summary: 'Balance Sheet',
    description:
      'Returns Assets, Liabilities, and Equity lists, verifying Assets === Liabilities + Equity.',
  })
  @ApiQuery({ name: 'asOfDate', required: false, description: 'ISO date, e.g. 2025-12-31' })
  @ApiResponse({ status: 200, description: 'Balance sheet report.' })
  getBalanceSheet(
    @Request() req: { user: { businessId: number } },
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.reportsService.getBalanceSheet(req.user.businessId, asOfDate);
  }

  /** GET /api/reports/income-statement?from=&to= */
  @Get('income-statement')
  @ApiOperation({
    summary: 'Income Statement',
    description:
      'Returns Revenue and Expense lists, calculating Net Income over a custom date range.',
  })
  @ApiQuery({ name: 'from', required: true, description: 'ISO date, e.g. 2025-01-01' })
  @ApiQuery({ name: 'to', required: true, description: 'ISO date, e.g. 2025-12-31' })
  @ApiResponse({ status: 200, description: 'Income statement report.' })
  getIncomeStatement(
    @Request() req: { user: { businessId: number } },
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('Query parameters from and to are required');
    }
    return this.reportsService.getIncomeStatement(req.user.businessId, from, to);
  }

  /** POST /api/reports/export */
  @Post('export')
  @ApiOperation({
    summary: 'Export financial statement',
    description:
      'Generates Excel or PDF binary for Trial Balance, Balance Sheet, or Income Statement.',
  })
  @ApiBody({ type: ExportReportDto })
  @ApiResponse({ status: 201, description: 'Excel or PDF binary file download.' })
  async exportFinancialReport(
    @Request() req: { user: { businessId: number } },
    @Res() res: Response,
    @Body() dto: ExportReportDto,
  ) {
    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    const { type, format, fromDate, toDate, asOfDate } = dto;
    const isPdf = format === ExportFormat.PDF;

    if (type === ReportType.TRIAL_BALANCE) {
      if (isPdf) {
        buffer = await this.reportsService.exportTrialBalancePdf(req.user.businessId, asOfDate);
        filename = 'trial-balance.pdf';
        contentType = 'application/pdf';
      } else {
        buffer = await this.reportsService.exportTrialBalanceExcel(req.user.businessId, asOfDate);
        filename = 'trial-balance.xlsx';
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
    } else if (type === ReportType.BALANCE_SHEET) {
      if (isPdf) {
        buffer = await this.reportsService.exportBalanceSheetPdf(req.user.businessId, asOfDate);
        filename = 'balance-sheet.pdf';
        contentType = 'application/pdf';
      } else {
        buffer = await this.reportsService.exportBalanceSheetExcel(req.user.businessId, asOfDate);
        filename = 'balance-sheet.xlsx';
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
    } else if (type === ReportType.INCOME_STATEMENT) {
      if (!fromDate || !toDate) {
        throw new BadRequestException(
          'fromDate and toDate are required for income-statement export',
        );
      }
      if (isPdf) {
        buffer = await this.reportsService.exportIncomeStatementPdf(
          req.user.businessId,
          fromDate,
          toDate,
        );
        filename = 'income-statement.pdf';
        contentType = 'application/pdf';
      } else {
        buffer = await this.reportsService.exportIncomeStatementExcel(
          req.user.businessId,
          fromDate,
          toDate,
        );
        filename = 'income-statement.xlsx';
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
    } else {
      throw new BadRequestException('Invalid report type for export');
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  /** GET /api/reports/ap-aging?asOfDate= */
  @Get('ap-aging')
  @ApiOperation({
    summary: 'Accounts Payable Aging Report',
    description: 'Get aging report of outstanding purchases/accounts payable.',
  })
  @ApiQuery({ name: 'asOfDate', required: false, description: 'ISO date, e.g. 2026-06-21' })
  @ApiResponse({ status: 200, description: 'AP aging summary and contacts breakdown.' })
  getAPAging(
    @Request() req: { user: { businessId: number } },
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.agingService.getAPAging(req.user.businessId, asOfDate);
  }

  /** GET /api/reports/ar-aging?asOfDate= */
  @Get('ar-aging')
  @ApiOperation({
    summary: 'Accounts Receivable Aging Report',
    description: 'Get aging report of outstanding sales/accounts receivable.',
  })
  @ApiQuery({ name: 'asOfDate', required: false, description: 'ISO date, e.g. 2026-06-21' })
  @ApiResponse({ status: 200, description: 'AR aging summary and contacts breakdown.' })
  getARAging(
    @Request() req: { user: { businessId: number } },
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.agingService.getARAging(req.user.businessId, asOfDate);
  }

  /** GET /api/reports/expense-breakdown?from=&to= */
  @Get('expense-breakdown')
  @ApiOperation({
    summary: 'Expense Breakdown Report',
    description: 'Get expenses grouped by category with their percentage share.',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Expense breakdown details.' })
  getExpenseBreakdown(
    @Request() req: { user: { businessId: number } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getExpenseBreakdown(req.user.businessId, from, to);
  }

  /** GET /api/reports/cash-flow?from=&to= */
  @Get('cash-flow')
  @ApiOperation({
    summary: 'Cash Flow Statement',
    description: 'Direct cash flow statement from operating activities.',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Cash flow summary and details.' })
  getCashFlow(
    @Request() req: { user: { businessId: number } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getCashFlowStatement(req.user.businessId, from, to);
  }

  /** GET /api/reports/gst?from=&to= */
  @Get('gst')
  @ApiOperation({
    summary: 'GST Report',
    description: 'GST collected on sales vs GST paid on purchases and expenses.',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'GST collected, paid, and net liability.' })
  getGST(
    @Request() req: { user: { businessId: number } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getGSTReport(req.user.businessId, from, to);
  }
}
