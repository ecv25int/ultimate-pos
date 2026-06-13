import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StockAdjustmentsService } from './stock-adjustments.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/update-stock-adjustment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id: number;
    businessId: number;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('stock-adjustments')
export class StockAdjustmentsController {
  constructor(private readonly service: StockAdjustmentsService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('locationId') locationId?: string) {
    return this.service.findAll(req.user.businessId, locationId ? Number(locationId) : undefined);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, req.user.businessId);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateStockAdjustmentDto) {
    return this.service.create(req.user.businessId, req.user.id, dto);
  }

  @Post(':id/confirm')
  confirm(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.confirmAdjustment(id, req.user.businessId);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStockAdjustmentDto,
  ) {
    return this.service.update(id, req.user.businessId, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, req.user.businessId);
  }
}
