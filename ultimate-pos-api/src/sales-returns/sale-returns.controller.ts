import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSaleReturnUseCase } from './application/use-cases/create-sale-return.use-case';
import { FindSaleReturnUseCase } from './application/use-cases/find-sale-return.use-case';
import { ListSaleReturnsUseCase } from './application/use-cases/list-sale-returns.use-case';
import { CreateSaleReturnDto } from './dto/create-sale-return.dto';
import { SaleReturnDto } from './dto/sale-return.dto';

@ApiTags('Sale Returns')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller()
export class SaleReturnsController {
  constructor(
    private readonly createUseCase: CreateSaleReturnUseCase,
    private readonly findUseCase: FindSaleReturnUseCase,
    private readonly listUseCase: ListSaleReturnsUseCase,
  ) {}

  @Post('sales/:saleId/returns')
  @ApiOperation({ summary: 'Create a return from a sale' })
  @ApiParam({ name: 'saleId', description: 'Original sale ID' })
  @ApiResponse({ status: 201, description: 'Return created with restocked inventory.' })
  @ApiResponse({ status: 400, description: 'Validation error (e.g. quantity exceeds original).' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  async create(
    @Request() req: any,
    @Param('saleId', ParseIntPipe) saleId: number,
    @Body() dto: CreateSaleReturnDto,
  ) {
    const entity = await this.createUseCase.execute(saleId, req.user.businessId, req.user.id, dto);
    return SaleReturnDto.fromEntity(entity);
  }

  @Get('sales/:saleId/returns')
  @ApiOperation({ summary: 'List all returns for a sale' })
  @ApiParam({ name: 'saleId', description: 'Original sale ID' })
  @ApiResponse({ status: 200, description: 'List of return transactions.' })
  async listBySale(
    @Request() req: any,
    @Param('saleId', ParseIntPipe) saleId: number,
  ) {
    const entities = await this.listUseCase.execute(saleId, req.user.businessId);
    return entities.map(SaleReturnDto.fromEntity);
  }

  @Get('returns/:id')
  @ApiOperation({ summary: 'Get a return by ID' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  @ApiResponse({ status: 200, description: 'Return details with lines.' })
  @ApiResponse({ status: 404, description: 'Return not found.' })
  async findOne(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const entity = await this.findUseCase.execute(id, req.user.businessId);
    return SaleReturnDto.fromEntity(entity);
  }
}
