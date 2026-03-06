import { Controller, Get, Param, ParseIntPipe, Query, Request, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** GET /api/reports/dashboard */
  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard KPIs', description: 'Returns today revenue, monthly totals, low-stock count, and top 5 products. Cached 5 min.' })
  @ApiResponse({ status: 200, description: 'Dashboard summary object.' })
  getDashboard(@Request() req: any) {
    return this.reportsService.getDashboard(req.user.businessId);
  }

  /** GET /api/reports/sales?from=&to= */
  @Get('sales')
  @ApiOperation({ summary: 'Sales report', description: 'Aggregated sales totals, counts, and top products for the date range.' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date, e.g. 2025-01-01' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date, e.g. 2025-12-31' })
  @ApiResponse({ status: 200, description: 'Sales report object.' })
  getSales(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getSalesReport(req.user.businessId, from, to);
  }

  /** GET /api/reports/purchases?from=&to= */
  @Get('purchases')
  @ApiOperation({ summary: 'Purchases report', description: 'Aggregated purchase totals and counts for the date range.' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Purchases report object.' })
  getPurchases(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getPurchasesReport(req.user.businessId, from, to);
  }

  /** GET /api/reports/stock */
  @Get('stock')
  @ApiOperation({ summary: 'Stock report', description: 'Current stock levels for all products, with low-stock flag.' })
  @ApiResponse({ status: 200, description: 'Array of stock entries per product.' })
  getStock(@Request() req: any) {
    return this.reportsService.getStockReport(req.user.businessId);
  }

  /** GET /api/reports/top-products?limit= */
  @Get('top-products')
  @ApiOperation({ summary: 'Top products by revenue' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of products to return (default 10)' })
  @ApiResponse({ status: 200, description: 'Array of top products.' })
  getTopProducts(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopProducts(
      req.user.businessId,
      limit ? +limit : 10,
    );
  }

  /** GET /api/reports/revenue?groupBy=day|month&days=30 */
  @Get('revenue')
  @ApiOperation({ summary: 'Revenue over time', description: 'Returns daily or monthly revenue totals for charting.' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'month'] })
  @ApiQuery({ name: 'days', required: false, example: 30, description: 'Number of days to look back' })
  @ApiResponse({ status: 200, description: 'Array of { date, revenue } data points.' })
  getRevenue(
    @Request() req: any,
    @Query('groupBy') groupBy: 'day' | 'month' = 'day',
    @Query('days') days?: string,
  ) {
    return this.reportsService.getRevenueByPeriod(
      req.user.businessId,
      groupBy,
      days ? +days : 30,
    );
  }

  /** GET /api/reports/expenses?from=&to= */
  @Get('expenses')
  @ApiOperation({ summary: 'Expense report', description: 'Total expenses grouped by category for the date range.' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Expense report object.' })
  getExpenses(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getExpenseReport(req.user.businessId, from, to);
  }

  /** GET /api/reports/tax?from=&to= */
  @Get('tax')
  @ApiOperation({ summary: 'Tax report', description: 'Tax collected on sales and paid on purchases for the date range.' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Tax report object.' })
  getTax(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getTaxReport(req.user.businessId, from, to);
  }

  /** GET /api/reports/profit-loss?from=&to= */
  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & Loss report', description: 'Revenue minus COGS and expenses for the date range. Includes gross and net margin percentages.' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'P&L report with grossProfit, netProfit, grossMargin, netMargin.' })
  getProfitLoss(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getProfitLoss(req.user.businessId, from, to);
  }

  /** GET /api/reports/customer/:id */
  @Get('customer/:id')
  @ApiOperation({ summary: 'Customer sales history' })
  @ApiParam({ name: 'id', description: 'Contact (customer) ID' })
  @ApiResponse({ status: 200, description: 'All sales for this customer.' })
  getCustomerReport(
    @Request() req: any,
    @Param('id', ParseIntPipe) contactId: number,
  ) {
    return this.reportsService.getCustomerReport(req.user.businessId, contactId);
  }

  /** GET /api/reports/supplier/:id */
  @Get('supplier/:id')
  @ApiOperation({ summary: 'Supplier purchase history' })
  @ApiParam({ name: 'id', description: 'Contact (supplier) ID' })
  @ApiResponse({ status: 200, description: 'All purchases from this supplier.' })
  getSupplierReport(
    @Request() req: any,
    @Param('id', ParseIntPipe) contactId: number,
  ) {
    return this.reportsService.getSupplierReport(req.user.businessId, contactId);
  }

  /** GET /api/reports/export?type=sales|purchases|stock&from=&to= */
  @Get('export')
  @ApiOperation({ summary: 'Export report to Excel', description: 'Downloads sales, purchases, or stock report as .xlsx file.' })
  @ApiQuery({ name: 'type', enum: ['sales', 'purchases', 'stock'], required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to',   required: false })
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
      buffer   = await this.reportsService.exportPurchasesExcel(req.user.businessId, from, to);
      filename = 'purchases-report.xlsx';
    } else if (type === 'stock') {
      buffer   = await this.reportsService.exportStockExcel(req.user.businessId);
      filename = 'stock-report.xlsx';
    } else {
      buffer   = await this.reportsService.exportSalesExcel(req.user.businessId, from, to);
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
  @ApiOperation({ summary: 'Export report to PDF', description: 'Downloads sales, purchases, stock, expenses, or P&L report as a .pdf file.' })
  @ApiQuery({ name: 'type', enum: ['sales', 'purchases', 'stock', 'expenses', 'profit-loss'], required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to',   required: false })
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
      buffer   = await this.reportsService.exportPurchasesPdf(req.user.businessId, from, to);
      filename = 'purchases-report.pdf';
    } else if (type === 'stock') {
      buffer   = await this.reportsService.exportStockPdf(req.user.businessId);
      filename = 'stock-report.pdf';
    } else if (type === 'expenses') {
      buffer   = await this.reportsService.exportExpensesPdf(req.user.businessId, from, to);
      filename = 'expenses-report.pdf';
    } else if (type === 'profit-loss') {
      buffer   = await this.reportsService.exportProfitLossPdf(req.user.businessId, from, to);
      filename = 'profit-loss-report.pdf';
    } else {
      buffer   = await this.reportsService.exportSalesPdf(req.user.businessId, from, to);
      filename = 'sales-report.pdf';
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }
}
