import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  Post,
  Delete,
  Param,
  Body,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportingService } from './reporting.service';
import { ExportService } from './export.service';
import { ScheduledReportService } from './scheduled-report.service';
import { CreateScheduledReportDto } from './dto/create-scheduled-report.dto';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';

interface AuthenticatedRequest {
  user: {
    businessId: number;
    userId: number;
    id?: number;
  };
}

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly exportService: ExportService,
    private readonly scheduledReportService: ScheduledReportService,
  ) {}

  @Get('sales-comprehensive')
  @ApiOperation({ summary: 'Comprehensive sales report with advanced filtering' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date, e.g. 2026-06-01' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date, e.g. 2026-06-30' })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  @ApiQuery({ name: 'contactId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  getSalesComprehensive(
    @Request() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('locationId') locationId?: string,
    @Query('contactId') contactId?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return this.reportingService.getSalesReport(req.user.businessId, from, to, {
      locationId: locationId ? +locationId : undefined,
      contactId: contactId ? +contactId : undefined,
      status,
      paymentStatus,
    });
  }

  @Get('customer-breakdown')
  @ApiOperation({ summary: 'Customer sales volume, orders, and averages breakdown' })
  @ApiQuery({ name: 'contactId', required: false, type: Number })
  getCustomerBreakdown(
    @Request() req: AuthenticatedRequest,
    @Query('contactId') contactId?: string,
  ) {
    return this.reportingService.getCustomerSalesBreakdown(req.user.businessId, {
      contactId: contactId ? +contactId : undefined,
    });
  }

  @Get('product-analysis')
  @ApiOperation({ summary: 'Product performance analytics and trends' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  getProductAnalysis(
    @Request() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.reportingService.getProductSalesAnalysis(req.user.businessId, {
      fromDate: from,
      toDate: to,
      locationId: locationId ? +locationId : undefined,
    });
  }

  @Get('recurring-invoices')
  @ApiOperation({ summary: 'List recurring invoice schedules and generation counts' })
  @ApiQuery({ name: 'status', required: false })
  getRecurringInvoices(@Request() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.reportingService.getRecurringInvoiceReport(req.user.businessId, { status });
  }

  @Get('purchases-comprehensive')
  @ApiOperation({ summary: 'Comprehensive purchases report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  @ApiQuery({ name: 'contactId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  getPurchasesComprehensive(
    @Request() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('locationId') locationId?: string,
    @Query('contactId') contactId?: string,
    @Query('status') status?: string,
  ) {
    return this.reportingService.getPurchaseReport(req.user.businessId, from, to, {
      locationId: locationId ? +locationId : undefined,
      contactId: contactId ? +contactId : undefined,
      status,
    });
  }

  @Get('supplier-analysis')
  @ApiOperation({ summary: 'Supplier purchase transactions analysis' })
  @ApiQuery({ name: 'contactId', required: false, type: Number })
  getSupplierAnalysis(
    @Request() req: AuthenticatedRequest,
    @Query('contactId') contactId?: string,
  ) {
    return this.reportingService.getSupplierAnalysis(req.user.businessId, {
      contactId: contactId ? +contactId : undefined,
    });
  }

  @Get('cogs')
  @ApiOperation({ summary: 'FIFO-based Cost of Goods Sold (COGS) report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  getCogsReport(
    @Request() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.reportingService.getCostOfGoodsReport(req.user.businessId, from, to, {
      locationId: locationId ? +locationId : undefined,
    });
  }

  @Get('stock-comprehensive')
  @ApiOperation({ summary: 'Inventory valuation report supporting backdated as-of-date' })
  @ApiQuery({ name: 'asOfDate', required: false })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  getStockComprehensive(
    @Request() req: AuthenticatedRequest,
    @Query('asOfDate') asOfDate?: string,
    @Query('locationId') locationId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.reportingService.getStockReport(req.user.businessId, asOfDate, {
      locationId: locationId ? +locationId : undefined,
      productId: productId ? +productId : undefined,
    });
  }

  @Get('expiry')
  @ApiOperation({ summary: 'Evaluates expiring or expired stock batches' })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  getExpiryReport(@Request() req: AuthenticatedRequest, @Query('locationId') locationId?: string) {
    return this.reportingService.getExpiryReport(req.user.businessId, {
      locationId: locationId ? +locationId : undefined,
    });
  }

  @Get('stock-movements')
  @ApiOperation({ summary: 'Stock movements chronological history log' })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'variationId', required: false, type: Number })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getStockMovements(
    @Request() req: AuthenticatedRequest,
    @Query('productId') productId?: string,
    @Query('variationId') variationId?: string,
    @Query('locationId') locationId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportingService.getStockMovementHistory(req.user.businessId, {
      productId: productId ? +productId : undefined,
      variationId: variationId ? +variationId : undefined,
      locationId: locationId ? +locationId : undefined,
      fromDate: from,
      toDate: to,
    });
  }

  @Get('slow-moving')
  @ApiOperation({ summary: 'List variations with low turnover relative to stock levels' })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  getSlowMoving(
    @Request() req: AuthenticatedRequest,
    @Query('locationId') locationId?: string,
    @Query('days') days?: string,
  ) {
    return this.reportingService.getSlowMovingStock(req.user.businessId, {
      locationId: locationId ? +locationId : undefined,
      days: days ? +days : undefined,
    });
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export a report in Excel format' })
  @ApiQuery({
    name: 'type',
    required: true,
    description: 'sales_summary | profit_loss | inventory | expenses | contacts',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async exportExcel(
    @Request() req: AuthenticatedRequest,
    @Query('type') type: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const { headers, rows } = await this.scheduledReportService.getReportData(
      req.user.businessId,
      type,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    const buffer = await this.exportService.exportToExcel(type, headers, rows);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${type}_report.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export a report in PDF format' })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async exportPdf(
    @Request() req: AuthenticatedRequest,
    @Query('type') type: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const { headers, colWidths, rows, summaryLines } =
      await this.scheduledReportService.getReportData(
        req.user.businessId,
        type,
        from ? new Date(from) : undefined,
        to ? new Date(to) : undefined,
      );
    const subtitle = from && to ? `Period: ${from} to ${to}` : 'All-time summary';
    const buffer = await this.exportService.exportToPDF(
      type,
      subtitle,
      headers,
      colWidths,
      rows,
      summaryLines,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${type}_report.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export a report in CSV format' })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async exportCsv(
    @Request() req: AuthenticatedRequest,
    @Query('type') type: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const { headers, rows } = await this.scheduledReportService.getReportData(
      req.user.businessId,
      type,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    const buffer = await this.exportService.exportToCSV(headers, rows);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}_report.csv"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // Scheduled Report Routes
  @Post('scheduled')
  @ApiOperation({ summary: 'Create a new scheduled report' })
  createScheduled(@Request() req: AuthenticatedRequest, @Body() dto: CreateScheduledReportDto) {
    const userId = req.user.userId || req.user.id || 0;
    return this.scheduledReportService.create(req.user.businessId, userId, dto);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get all scheduled reports' })
  findAllScheduled(@Request() req: AuthenticatedRequest) {
    return this.scheduledReportService.findAll(req.user.businessId);
  }

  @Delete('scheduled/:id')
  @ApiOperation({ summary: 'Delete a scheduled report' })
  deleteScheduled(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.scheduledReportService.remove(req.user.businessId, id);
  }

  @Post('scheduled/:id/run')
  @ApiOperation({ summary: 'Manually run a scheduled report' })
  runScheduled(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.scheduledReportService.runReportManually(req.user.businessId, id);
  }
}
