import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StockTransfersService } from './stock-transfers.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';

interface AuthenticatedRequest {
  user: {
    id: number;
    businessId: number;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('stock-transfers')
export class StockTransfersController {
  constructor(private readonly stockTransfersService: StockTransfersService) {}

  /** POST /api/stock-transfers */
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateStockTransferDto) {
    return this.stockTransfersService.create(req.user.businessId, req.user.id, dto);
  }

  /** GET /api/stock-transfers?productId=&status=&page=&limit= */
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockTransfersService.findAll(req.user.businessId, {
      productId: productId ? Number(productId) : undefined,
      status,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 30, 100),
    });
  }

  /** GET /api/stock-transfers/:id */
  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.stockTransfersService.findOne(req.user.businessId, id);
  }

  /** PATCH /api/stock-transfers/:id/status */
  @Patch(':id/status')
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.stockTransfersService.updateStatus(req.user.businessId, id, status);
  }

  /** POST /api/stock-transfers/:id/receive */
  @Post(':id/receive')
  receive(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body('receivedQty') receivedQty?: number,
  ) {
    return this.stockTransfersService.receiveTransfer(id, req.user.businessId, receivedQty);
  }
}
