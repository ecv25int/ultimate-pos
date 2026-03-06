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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Purchases')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  /** GET /api/purchases/summary */
  @Get('summary')
  @ApiOperation({ summary: 'Get purchases summary', description: 'Returns total purchase count, total cost, and payment status breakdown.' })
  @ApiResponse({ status: 200, description: 'Summary object.' })
  getSummary(@Request() req: any) {
    return this.purchasesService.getSummary(req.user.businessId);
  }

  /** POST /api/purchases */
  @Post()
  @ApiOperation({ summary: 'Create a new purchase', description: 'Creates a purchase order. If status is "received", automatically increments stock.' })
  @ApiResponse({ status: 201, description: 'Created purchase with ref number.' })
  create(@Request() req: any, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  /** GET /api/purchases */
  @Get()
  @ApiOperation({ summary: 'List purchases', description: 'Paginated list of purchases. Max limit: 100.' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['received', 'ordered', 'pending', 'cancelled'] })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['paid', 'due', 'partial'] })
  @ApiQuery({ name: 'type', required: false, enum: ['purchase', 'requisition'], description: 'Filter by type. Defaults to "purchase" when omitted.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Max 100' })
  @ApiResponse({ status: 200, description: 'Paginated { total, page, limit, data[] }.' })
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('type') type?: string,
    @Query('contactId') contactId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.purchasesService.findAll(req.user.businessId, {
      search,
      status,
      paymentStatus,
      type,
      contactId: contactId ? +contactId : undefined,
      page: page ? +page : 1,
      limit: Math.min(limit ? +limit : 20, 100),
    });
  }

  /** GET /api/purchases/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get purchase by ID' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  @ApiResponse({ status: 200, description: 'Purchase details with lines.' })
  @ApiResponse({ status: 404, description: 'Purchase not found.' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.findOne(req.user.businessId, id);
  }

  /** POST /api/purchases/:id/convert-to-order */
  @Post(':id/convert-to-order')
  @ApiOperation({ summary: 'Convert requisition to purchase order', description: 'Changes type from requisition to purchase and sets status to ordered.' })
  @ApiParam({ name: 'id', description: 'Requisition ID' })
  @ApiResponse({ status: 200, description: 'Purchase order created from requisition.' })
  @ApiResponse({ status: 404, description: 'Requisition not found.' })
  convertToOrder(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.convertToOrder(req.user.businessId, id);
  }

  /** POST /api/purchases/:id/return */
  @Post(':id/return')
  @ApiOperation({ summary: 'Create purchase return', description: 'Returns items. Automatically decrements the previously received stock.' })
  @ApiParam({ name: 'id', description: 'Original purchase ID' })
  @ApiResponse({ status: 201, description: 'Return purchase created.' })
  createReturn(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { lines: { productId: number; quantity: number; unitCost: number }[]; note?: string },
  ) {
    return this.purchasesService.createReturn(req.user.businessId, req.user.id, id, dto);
  }

  /** PATCH /api/purchases/:id */
  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  @ApiResponse({ status: 200, description: 'Updated purchase.' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(req.user.businessId, id, dto);
  }

  /** DELETE /api/purchases/:id */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete purchase' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation.' })
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.remove(req.user.businessId, id);
  }
}
