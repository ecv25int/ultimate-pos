import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CancelTransactionUseCase } from './application/use-cases/cancel-transaction.use-case';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { FinalizeTransactionUseCase } from './application/use-cases/finalize-transaction.use-case';
import { FindTransactionUseCase } from './application/use-cases/find-transaction.use-case';
import { GetTransactionTotalUseCase } from './application/use-cases/get-transaction-total.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { UpdateTransactionUseCase } from './application/use-cases/update-transaction.use-case';
import { TransactionType } from './domain/transaction-type';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createUseCase: CreateTransactionUseCase,
    private readonly findUseCase: FindTransactionUseCase,
    private readonly listUseCase: ListTransactionsUseCase,
    private readonly updateUseCase: UpdateTransactionUseCase,
    private readonly finalizeUseCase: FinalizeTransactionUseCase,
    private readonly cancelUseCase: CancelTransactionUseCase,
    private readonly getTotalUseCase: GetTransactionTotalUseCase,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateTransactionDto) {
    const entity = await this.createUseCase.execute(req.user.businessId, req.user.id, dto);
    return TransactionDto.fromEntity(entity);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.listUseCase.execute(req.user.businessId, {
      type: type as TransactionType | undefined,
      status,
      search,
      from,
      to,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
    return { ...result, data: result.data.map(TransactionDto.fromEntity) };
  }

  @Get(':id')
  async findById(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
  ) {
    const entity = await this.findUseCase.execute(
      id,
      req.user.businessId,
      type as TransactionType | undefined,
    );
    return TransactionDto.fromEntity(entity);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    const entity = await this.updateUseCase.execute(id, req.user.businessId, dto);
    return TransactionDto.fromEntity(entity);
  }

  @Post(':id/finalize')
  async finalize(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
  ) {
    const entity = await this.finalizeUseCase.execute(
      id,
      req.user.businessId,
      type as TransactionType | undefined,
    );
    return TransactionDto.fromEntity(entity);
  }

  @Post(':id/cancel')
  async cancel(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
  ) {
    const entity = await this.cancelUseCase.execute(
      id,
      req.user.businessId,
      type as TransactionType | undefined,
    );
    return TransactionDto.fromEntity(entity);
  }

  @Get(':id/total')
  getTotal(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
  ) {
    return this.getTotalUseCase.execute(
      id,
      req.user.businessId,
      type as TransactionType | undefined,
    );
  }
}
