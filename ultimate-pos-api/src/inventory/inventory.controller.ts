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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { GetInventorySummaryUseCase } from './application/use-cases/get-inventory-summary.use-case';
import { GetStockOverviewUseCase } from './application/use-cases/get-stock-overview.use-case';
import { GetStockLevelUseCase } from './application/use-cases/get-stock-level.use-case';
import { GetLowStockUseCase } from './application/use-cases/get-low-stock.use-case';
import { GetProductHistoryUseCase } from './application/use-cases/get-product-history.use-case';
import { GetAdjustmentsUseCase } from './application/use-cases/get-adjustments.use-case';
import { CreateStockEntryUseCase } from './application/use-cases/create-stock-entry.use-case';
import { DeleteStockEntryUseCase } from './application/use-cases/delete-stock-entry.use-case';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';

@ApiTags('Inventory')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly getInventorySummary: GetInventorySummaryUseCase,
    private readonly getStockOverview: GetStockOverviewUseCase,
    private readonly getStockLevel: GetStockLevelUseCase,
    private readonly getLowStock: GetLowStockUseCase,
    private readonly getProductHistory: GetProductHistoryUseCase,
    private readonly getAdjustments: GetAdjustmentsUseCase,
    private readonly createStockEntry: CreateStockEntryUseCase,
    private readonly deleteStockEntry: DeleteStockEntryUseCase,
  ) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Inventory dashboard summary (totals, low-stock count, stock value)' })
  summary(@Request() req: any) {
    return this.getInventorySummary.execute(req.user.businessId);
  }

  @Get('stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Stock overview — all stock-enabled products with current quantities' })
  @ApiQuery({ name: 'search', required: false })
  stockOverview(@Request() req: any, @Query('search') search?: string) {
    return this.getStockOverview.execute(req.user.businessId, search);
  }

  @Get('stock/low')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Low-stock alerts — products at or below alert quantity' })
  @ApiResponse({ status: 200, description: 'List of low-stock products.' })
  lowStock(@Request() req: any) {
    return this.getLowStock.execute(req.user.businessId);
  }

  @Get('stock/:productId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Current stock level for a single product' })
  @ApiParam({ name: 'productId' })
  productStockLevel(
    @Param('productId', ParseIntPipe) productId: number,
    @Request() req: any,
  ) {
    return this.getStockLevel.execute(productId, req.user.businessId);
  }

  @Get('stock/:productId/history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Stock movement history for a product' })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  productHistory(
    @Param('productId', ParseIntPipe) productId: number,
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.getProductHistory.execute(
      productId,
      req.user.businessId,
      limit ? Math.min(parseInt(limit, 10), 100) : 50,
    );
  }

  @Get('adjustments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Paginated list of manual stock adjustments' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  @ApiQuery({ name: 'productId', required: false })
  adjustments(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
  ) {
    return this.getAdjustments.execute(
      req.user.businessId,
      Number(page) || 1,
      Math.min(Number(limit) || 30, 100),
      productId ? Number(productId) : undefined,
    );
  }

  @Post('entries')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a manual stock entry (opening stock, adjustment, etc.)' })
  async createEntry(@Request() req: any, @Body() dto: CreateStockEntryDto) {
    return this.createStockEntry.execute(req.user.id, req.user.businessId, dto);
  }

  @Delete('entries/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a stock entry' })
  @ApiParam({ name: 'id' })
  async deleteEntry(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.deleteStockEntry.execute(id, req.user.businessId);
    return { message: 'Stock entry deleted' };
  }
}
