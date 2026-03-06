import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Sales')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /** GET /api/sales/summary */
  @Get('summary')
  @ApiOperation({ summary: 'Get sales summary', description: 'Returns total sales count, revenue, and payment status breakdown for the business.' })
  @ApiResponse({ status: 200, description: 'Summary object.' })
  getSummary(@Request() req: any) {
    return this.salesService.getSummary(req.user.businessId);
  }

  /** POST /api/sales */
  @Post()
  @ApiOperation({ summary: 'Create a new sale', description: 'Creates a sale with line items. Automatically decrements stock for each line.' })
  @ApiResponse({ status: 201, description: 'Created sale with invoice number.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(@Request() req: any, @Body() dto: CreateSaleDto) {
    return this.salesService.create(req.user.businessId, req.user.id, dto);
  }

  /** GET /api/sales?search=&status=&paymentStatus=&contactId=&page=&limit= */
  @Get()
  @ApiOperation({ summary: 'List sales', description: 'Paginated list of sales with optional filters. Max limit: 100.' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by invoice number' })
  @ApiQuery({ name: 'status', required: false, enum: ['final', 'pending', 'draft'] })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['paid', 'due', 'partial'] })
  @ApiQuery({ name: 'type', required: false, enum: ['sale', 'sale_return', 'quotation'], description: 'Filter by sale type' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Max 100' })
  @ApiResponse({ status: 200, description: 'Paginated { total, page, limit, data[] }.' })
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('contactId') contactId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesService.findAll(req.user.businessId, {
      search,
      status,
      paymentStatus,
      contactId: contactId ? +contactId : undefined,
      type,
      page: page ? +page : 1,
      limit: Math.min(limit ? +limit : 20, 100),
    });
  }

  /** GET /api/sales/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({ status: 200, description: 'Sale details with lines and payments.' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(req.user.businessId, id);
  }

  /** POST /api/sales/:id/return */
  @Post(':id/return')
  @ApiOperation({ summary: 'Create sale return', description: 'Returns items from a sale. Automatically restocks the returned quantities.' })
  @ApiParam({ name: 'id', description: 'Original sale ID' })
  @ApiResponse({ status: 201, description: 'Return sale created.' })
  createReturn(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { lines: { productId: number; quantity: number; unitPrice: number }[]; note?: string },
  ) {
    return this.salesService.createReturn(req.user.businessId, req.user.id, id, dto);
  }

  @Post(':id/convert-to-invoice')
  @ApiOperation({ summary: 'Convert quotation or draft to final invoice' })
  @ApiParam({ name: 'id', description: 'Quotation or draft sale ID' })
  @ApiResponse({ status: 200, description: 'Converted sale.' })
  convertToInvoice(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.salesService.convertToInvoice(req.user.businessId, id);
  }

  /** PATCH /api/sales/:id */
  @Patch(':id')
  @ApiOperation({ summary: 'Update sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({ status: 200, description: 'Updated sale.' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.salesService.update(req.user.businessId, id, dto);
  }

  /** DELETE /api/sales/:id */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation.' })
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.salesService.remove(req.user.businessId, id);
  }
}
