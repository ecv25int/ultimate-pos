import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddPaymentUseCase } from './application/use-cases/add-payment.use-case';
import { AddBulkPaymentsUseCase } from './application/use-cases/add-bulk-payments.use-case';
import { ListPaymentsUseCase } from './application/use-cases/list-payments.use-case';
import { FindPaymentUseCase } from './application/use-cases/find-payment.use-case';
import { DeletePaymentUseCase } from './application/use-cases/delete-payment.use-case';
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case';
import { CreatePaymentDto, BulkPaymentDto } from './dto/create-payment.dto';
import { PaymentDto } from './dto/payment.dto';

// ── Flat /payments routes ────────────────────────────────────────────────────

@ApiTags('Payments')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly addPayment: AddPaymentUseCase,
    private readonly addBulkPayments: AddBulkPaymentsUseCase,
    private readonly listPayments: ListPaymentsUseCase,
    private readonly findPayment: FindPaymentUseCase,
    private readonly deletePayment: DeletePaymentUseCase,
    private readonly getBalance: GetBalanceUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Record a payment for a sale or purchase' })
  @ApiResponse({
    status: 201,
    description: 'Payment created. Parent paymentStatus updated automatically.',
  })
  async create(@Request() req: any, @Body() dto: CreatePaymentDto) {
    const entity = await this.addPayment.execute(req.user.businessId, req.user.id, dto);
    return PaymentDto.fromEntity(entity);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Record multiple payments in sequence' })
  async createBulk(@Request() req: any, @Body() dto: BulkPaymentDto) {
    const result = await this.addBulkPayments.execute(
      req.user.businessId,
      req.user.id,
      dto.payments,
    );
    return { created: result.created, payments: result.payments.map(PaymentDto.fromEntity) };
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'saleId', required: false })
  @ApiQuery({ name: 'purchaseId', required: false })
  @ApiQuery({
    name: 'method',
    required: false,
    enum: ['cash', 'card', 'bank_transfer', 'check', 'other'],
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  async findAll(
    @Request() req: any,
    @Query('saleId') saleId?: string,
    @Query('purchaseId') purchaseId?: string,
    @Query('method') method?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.listPayments.execute(req.user.businessId, {
      saleId: saleId ? Number(saleId) : undefined,
      purchaseId: purchaseId ? Number(purchaseId) : undefined,
      method,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 30, 100),
    });
    return { ...result, data: result.data.map(PaymentDto.fromEntity) };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get remaining balance for a sale or purchase' })
  @ApiQuery({ name: 'saleId', required: false })
  @ApiQuery({ name: 'purchaseId', required: false })
  getBalanceQuery(
    @Request() req: any,
    @Query('saleId') saleId?: string,
    @Query('purchaseId') purchaseId?: string,
  ) {
    return this.getBalance.execute(
      req.user.businessId,
      saleId ? Number(saleId) : undefined,
      purchaseId ? Number(purchaseId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id' })
  async findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const entity = await this.findPayment.execute(id, req.user.businessId);
    return PaymentDto.fromEntity(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment (recalculates parent payment status)' })
  @ApiParam({ name: 'id' })
  async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.deletePayment.execute(id, req.user.businessId);
    return { message: 'Payment deleted' };
  }
}

// ── Nested /sales/:saleId/payments routes ────────────────────────────────────

@ApiTags('Sales / Payments')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('sales/:saleId/payments')
export class SalePaymentsController {
  constructor(
    private readonly addPayment: AddPaymentUseCase,
    private readonly listPayments: ListPaymentsUseCase,
    private readonly getBalance: GetBalanceUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add payment to a sale' })
  @ApiParam({ name: 'saleId' })
  async create(
    @Request() req: any,
    @Param('saleId', ParseIntPipe) saleId: number,
    @Body() dto: Omit<CreatePaymentDto, 'saleId' | 'purchaseId'>,
  ) {
    const entity = await this.addPayment.execute(req.user.businessId, req.user.id, {
      ...dto,
      saleId,
    } as CreatePaymentDto);
    return PaymentDto.fromEntity(entity);
  }

  @Get()
  @ApiOperation({ summary: 'List payments for a sale' })
  @ApiParam({ name: 'saleId' })
  async findAll(@Request() req: any, @Param('saleId', ParseIntPipe) saleId: number) {
    const result = await this.listPayments.execute(req.user.businessId, { saleId });
    return { ...result, data: result.data.map(PaymentDto.fromEntity) };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get remaining balance for a sale' })
  @ApiParam({ name: 'saleId' })
  balance(@Request() req: any, @Param('saleId', ParseIntPipe) saleId: number) {
    return this.getBalance.forSale(saleId, req.user.businessId);
  }
}

// ── Nested /purchases/:purchaseId/payments routes ────────────────────────────

@ApiTags('Purchases / Payments')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('purchases/:purchaseId/payments')
export class PurchasePaymentsController {
  constructor(
    private readonly addPayment: AddPaymentUseCase,
    private readonly listPayments: ListPaymentsUseCase,
    private readonly getBalance: GetBalanceUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add payment to a purchase' })
  @ApiParam({ name: 'purchaseId' })
  async create(
    @Request() req: any,
    @Param('purchaseId', ParseIntPipe) purchaseId: number,
    @Body() dto: Omit<CreatePaymentDto, 'saleId' | 'purchaseId'>,
  ) {
    const entity = await this.addPayment.execute(req.user.businessId, req.user.id, {
      ...dto,
      purchaseId,
    } as CreatePaymentDto);
    return PaymentDto.fromEntity(entity);
  }

  @Get()
  @ApiOperation({ summary: 'List payments for a purchase' })
  @ApiParam({ name: 'purchaseId' })
  async findAll(@Request() req: any, @Param('purchaseId', ParseIntPipe) purchaseId: number) {
    const result = await this.listPayments.execute(req.user.businessId, { purchaseId });
    return { ...result, data: result.data.map(PaymentDto.fromEntity) };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get remaining balance for a purchase' })
  @ApiParam({ name: 'purchaseId' })
  balance(@Request() req: any, @Param('purchaseId', ParseIntPipe) purchaseId: number) {
    return this.getBalance.forPurchase(purchaseId, req.user.businessId);
  }
}
