import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  Res,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateInvoiceLayoutDto } from './dto/create-invoice-layout.dto';
import { CreateInvoiceSchemeDto } from './dto/create-invoice-scheme.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * GET /api/documents/barcode?text=ABC-123&type=C128
   * Returns a PNG barcode image for arbitrary text
   */
  @Get('barcode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async generateBarcode(
    @Query('text') text: string,
    @Query('type') type = 'C128',
    @Res() res: Response,
  ) {
    if (!text) throw new BadRequestException('text query parameter is required');
    const buffer = await this.documentsService.generateBarcode(text, type);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="barcode.png"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });
    res.end(buffer);
  }

  /**
   * GET /api/documents/barcode/product/:id
   * Returns a PNG barcode image for the product's SKU
   */
  @Get('barcode/product/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async getProductBarcode(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const { buffer, sku, name } = await this.documentsService.generateProductBarcode(
      id,
      req.user.businessId,
    );
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="barcode-${sku}.png"`,
      'Content-Length': buffer.length,
      'X-Product-Name': encodeURIComponent(name),
      'X-Product-Sku': encodeURIComponent(sku),
      'Cache-Control': 'no-cache',
    });
    res.end(buffer);
  }

  /**
   * GET /api/documents/invoice/:saleId
   * Returns all data needed to render a printable invoice
   */
  @Get('invoice/:saleId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  getInvoiceData(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Request() req: any,
  ) {
    return this.documentsService.getInvoiceData(saleId, req.user.businessId);
  }

  /**
   * GET /api/documents/receipt/:saleId
   * Returns self-contained printable HTML that auto-triggers window.print()
   */
  @Get('receipt/:saleId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async getReceiptHtml(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const html = await this.documentsService.generateReceiptHtml(
      saleId,
      req.user.businessId,
    );
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    res.send(html);
  }

  // ─── Invoice Layouts ────────────────────────────────────────────────────────

  @Get('invoice-layouts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getInvoiceLayouts(@Request() req: any) {
    return this.documentsService.getInvoiceLayouts(req.user.businessId);
  }

  @Post('invoice-layouts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  createInvoiceLayout(@Body() dto: CreateInvoiceLayoutDto, @Request() req: any) {
    return this.documentsService.createInvoiceLayout(req.user.businessId, dto);
  }

  @Get('invoice-layouts/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getInvoiceLayout(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.documentsService.getInvoiceLayout(id, req.user.businessId);
  }

  @Patch('invoice-layouts/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateInvoiceLayout(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateInvoiceLayoutDto>,
    @Request() req: any,
  ) {
    return this.documentsService.updateInvoiceLayout(id, req.user.businessId, dto);
  }

  @Delete('invoice-layouts/:id')
  @Roles(UserRole.ADMIN)
  removeInvoiceLayout(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.documentsService.removeInvoiceLayout(id, req.user.businessId);
  }

  // ─── Invoice Schemes ────────────────────────────────────────────────────────

  @Get('invoice-schemes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getInvoiceSchemes(@Request() req: any) {
    return this.documentsService.getInvoiceSchemes(req.user.businessId);
  }

  @Post('invoice-schemes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  createInvoiceScheme(@Body() dto: CreateInvoiceSchemeDto, @Request() req: any) {
    return this.documentsService.createInvoiceScheme(req.user.businessId, dto);
  }

  @Get('invoice-schemes/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getInvoiceScheme(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.documentsService.getInvoiceScheme(id, req.user.businessId);
  }

  @Patch('invoice-schemes/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateInvoiceScheme(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateInvoiceSchemeDto>,
    @Request() req: any,
  ) {
    return this.documentsService.updateInvoiceScheme(id, req.user.businessId, dto);
  }

  @Delete('invoice-schemes/:id')
  @Roles(UserRole.ADMIN)
  removeInvoiceScheme(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.documentsService.removeInvoiceScheme(id, req.user.businessId);
  }
}
