import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashRegisterService } from './cash-register.service';
import {
  AddTransactionDto,
  CloseRegisterDto,
  CreateCashRegisterDto,
} from './dto/create-cash-register.dto';

@UseGuards(JwtAuthGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  /** GET /api/cash-register/summary */
  @Get('summary')
  getSummary(@Req() req: any) {
    return this.cashRegisterService.getSummary(req.user.businessId);
  }

  /** GET /api/cash-register/active */
  @Get('active')
  getActiveSession(@Req() req: any) {
    return this.cashRegisterService.getActiveSession(
      req.user.businessId,
      req.user.id,
    );
  }

  /** POST /api/cash-register/open */
  @Post('open')
  openRegister(@Req() req: any, @Body() dto: CreateCashRegisterDto) {
    return this.cashRegisterService.openRegister(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  /** GET /api/cash-register */
  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.cashRegisterService.findAll(req.user.businessId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? Math.min(parseInt(limit), 100) : undefined,
      status,
    });
  }

  /** GET /api/cash-register/:id */
  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.cashRegisterService.findOne(req.user.businessId, id);
  }

  /** POST /api/cash-register/:id/transaction */
  @Post(':id/transaction')
  addTransaction(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddTransactionDto,
  ) {
    return this.cashRegisterService.addTransaction(
      req.user.businessId,
      id,
      req.user.id,
      dto,
    );
  }

  /** POST /api/cash-register/:id/close */
  @Post(':id/close')
  closeRegister(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseRegisterDto,
  ) {
    return this.cashRegisterService.closeRegister(
      req.user.businessId,
      id,
      req.user.id,
      dto,
    );
  }
}
