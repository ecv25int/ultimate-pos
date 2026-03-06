import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, BulkPaymentDto } from './dto/create-payment.dto';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** POST /api/payments */
  @Post()
  create(@Req() req: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(req.user.businessId, req.user.id, dto);
  }

  /** POST /api/payments/bulk */
  @Post('bulk')
  createBulk(@Req() req: any, @Body() dto: BulkPaymentDto) {
    return this.paymentsService.createBulk(req.user.businessId, req.user.id, dto.payments);
  }

  /** GET /api/payments?saleId=&purchaseId=&method=&page=&limit= */
  @Get()
  findAll(
    @Req() req: any,
    @Query('saleId') saleId?: string,
    @Query('purchaseId') purchaseId?: string,
    @Query('method') method?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAll(req.user.businessId, {
      saleId: saleId ? Number(saleId) : undefined,
      purchaseId: purchaseId ? Number(purchaseId) : undefined,
      method,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 30, 100),
    });
  }

  /** GET /api/payments/:id */
  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(req.user.businessId, id);
  }

  /** DELETE /api/payments/:id */
  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(req.user.businessId, id);
  }
}
