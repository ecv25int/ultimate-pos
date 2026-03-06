import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PosService } from './pos.service';
import { CashDrawerService } from './cash-drawer.service';
import { CreateSaleDto } from '../sales/dto/create-sale.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('POS')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('pos')
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly cashDrawer: CashDrawerService,
  ) {}

  /** GET /api/pos/products/scan?barcode= — exact SKU / barcode lookup */
  @Get('products/scan')
  @ApiOperation({ summary: 'Scan barcode / look up by exact SKU', description: 'Returns a single product matching the exact barcode/SKU, including current stock.' })
  @ApiQuery({ name: 'barcode', required: true, description: 'Exact barcode or SKU string' })
  @ApiResponse({ status: 200, description: 'Matched product or null.' })
  scanByBarcode(@Request() req: any, @Query('barcode') barcode: string) {
    return this.posService.scanByBarcode(req.user.businessId, barcode);
  }

  /** GET /api/pos/products?q= — product search for POS picker */
  @Get('products')
  @ApiOperation({ summary: 'Search products for POS', description: 'Fast product search used by the POS terminal. Results cached 1 min.' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term (name or SKU)' })
  @ApiResponse({ status: 200, description: 'Array of matching products with stock levels.' })
  searchProducts(@Request() req: any, @Query('q') query?: string) {
    return this.posService.searchProducts(req.user.businessId, query);
  }

  /** POST /api/pos/transaction — process a POS sale */
  @Post('transaction')
  @ApiOperation({ summary: 'Process POS transaction', description: 'Creates a finalized sale from the POS terminal. Decrements stock immediately.' })
  @ApiResponse({ status: 201, description: 'Completed sale with receipt data.' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or validation error.' })
  processTransaction(@Request() req: any, @Body() dto: CreateSaleDto) {
    return this.posService.processTransaction(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  /** POST /api/pos/cash-drawer/open — send ESC/POS open-drawer command */
  @Post('cash-drawer/open')
  @ApiOperation({ summary: 'Open cash drawer', description: 'Sends the ESC/POS pulse command to the configured cash drawer via TCP or serial.' })
  @ApiResponse({ status: 201, description: 'Command sent (or silently skipped when not configured).' })
  async openCashDrawer(@Request() req: any) {
    await this.cashDrawer.open(req.user.businessId);
    return { opened: true };
  }

  /** GET /api/pos/recent — last 50 POS transactions */
  @Get('recent')
  @ApiOperation({ summary: 'Recent POS transactions', description: 'Returns the last 50 POS sales for the current business.' })
  @ApiResponse({ status: 200, description: 'Array of recent sales.' })
  getRecentTransactions(@Request() req: any) {
    return this.posService.getRecentTransactions(req.user.businessId);
  }
}
