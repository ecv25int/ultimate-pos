import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getSummary(@Request() req: any) {
    return this.inventoryService.getSummary(req.user.businessId);
  }

  @Get('stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  getStockOverview(
    @Request() req: any,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getStockOverview(req.user.businessId, search);
  }

  @Get('adjustments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getAdjustments(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
  ) {
    return this.inventoryService.getAdjustments(
      req.user.businessId,
      Number(page) || 1,
      Math.min(Number(limit) || 30, 100),
      productId ? Number(productId) : undefined,
    );
  }

  @Get('stock/:productId/history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getProductHistory(
    @Param('productId', ParseIntPipe) productId: number,
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getProductHistory(
      productId,
      req.user.businessId,
      limit ? Math.min(parseInt(limit, 10), 100) : 50,
    );
  }

  @Post('entries')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createEntry(@Request() req: any, @Body() dto: CreateStockEntryDto) {
    return this.inventoryService.createEntry(req.user.id, req.user.businessId, dto);
  }

  @Delete('entries/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  deleteEntry(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.inventoryService.deleteEntry(id, req.user.businessId);
  }
}
