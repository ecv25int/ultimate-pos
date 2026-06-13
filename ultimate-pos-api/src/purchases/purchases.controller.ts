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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePurchaseUseCase } from './application/use-cases/create-purchase.use-case';
import { FindPurchaseUseCase } from './application/use-cases/find-purchase.use-case';
import { ListPurchasesUseCase } from './application/use-cases/list-purchases.use-case';
import { UpdatePurchaseUseCase } from './application/use-cases/update-purchase.use-case';
import { FinalizePurchaseUseCase } from './application/use-cases/finalize-purchase.use-case';
import { CreatePurchaseReturnUseCase } from './application/use-cases/create-purchase-return.use-case';
import { GetPurchasesSummaryUseCase } from './application/use-cases/get-purchases-summary.use-case';
import { ConvertRequisitionUseCase } from './application/use-cases/convert-requisition.use-case';
import { DeletePurchaseUseCase } from './application/use-cases/delete-purchase.use-case';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseDto } from './dto/purchase.dto';

@ApiTags('Purchases')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly createPurchase: CreatePurchaseUseCase,
    private readonly findPurchase: FindPurchaseUseCase,
    private readonly listPurchases: ListPurchasesUseCase,
    private readonly updatePurchase: UpdatePurchaseUseCase,
    private readonly finalizePurchase: FinalizePurchaseUseCase,
    private readonly createReturn: CreatePurchaseReturnUseCase,
    private readonly getSummary: GetPurchasesSummaryUseCase,
    private readonly convertRequisition: ConvertRequisitionUseCase,
    private readonly deletePurchase: DeletePurchaseUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get purchases summary' })
  @ApiResponse({ status: 200, description: 'Summary object.' })
  async summary(@Request() req: any) {
    return this.getSummary.execute(req.user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new purchase' })
  @ApiResponse({ status: 201, description: 'Created purchase.' })
  async create(@Request() req: any, @Body() dto: CreatePurchaseDto) {
    const entity = await this.createPurchase.execute(req.user.businessId, req.user.id, dto);
    return PurchaseDto.fromEntity(entity);
  }

  @Get()
  @ApiOperation({ summary: 'List purchases' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['received', 'ordered', 'pending', 'cancelled'],
  })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['paid', 'due', 'partial'] })
  @ApiQuery({ name: 'type', required: false, enum: ['purchase', 'requisition'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated { total, page, limit, data[] }.' })
  async findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('type') type?: string,
    @Query('contactId') contactId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.listPurchases.execute(req.user.businessId, {
      search,
      status,
      paymentStatus,
      type,
      contactId: contactId ? +contactId : undefined,
      page: page ? +page : 1,
      limit: Math.min(limit ? +limit : 20, 100),
    });
    return { ...result, data: result.data.map(PurchaseDto.fromEntity) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase by ID' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  @ApiResponse({ status: 200, description: 'Purchase details with lines.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const entity = await this.findPurchase.execute(id, req.user.businessId);
    return PurchaseDto.fromEntity(entity);
  }

  @Post(':id/finalize')
  @ApiOperation({ summary: 'Finalize (receive) a purchase order' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  @ApiResponse({ status: 200, description: 'Finalized purchase.' })
  async finalize(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const entity = await this.finalizePurchase.execute(id, req.user.businessId);
    return PurchaseDto.fromEntity(entity);
  }

  @Post(':id/convert-to-order')
  @ApiOperation({ summary: 'Convert requisition to purchase order' })
  @ApiParam({ name: 'id', description: 'Requisition ID' })
  @ApiResponse({ status: 200, description: 'Purchase order created from requisition.' })
  @ApiResponse({ status: 404, description: 'Requisition not found.' })
  async convertToOrder(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const entity = await this.convertRequisition.execute(id, req.user.businessId);
    return PurchaseDto.fromEntity(entity);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Create purchase return' })
  @ApiParam({ name: 'id', description: 'Original purchase ID' })
  @ApiResponse({ status: 201, description: 'Return purchase created.' })
  async createPurchaseReturn(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: { lines: { productId: number; quantity: number; unitCost: number }[]; note?: string },
  ) {
    const entity = await this.createReturn.execute(id, req.user.businessId, req.user.id, {
      lines: body.lines,
      note: body.note,
    });
    return PurchaseDto.fromEntity(entity);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  @ApiResponse({ status: 200, description: 'Updated purchase.' })
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseDto,
  ) {
    const entity = await this.updatePurchase.execute(id, req.user.businessId, dto);
    return PurchaseDto.fromEntity(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete purchase' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation.' })
  async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.deletePurchase.execute(id, req.user.businessId);
    return { message: `Purchase #${id} deleted` };
  }
}
