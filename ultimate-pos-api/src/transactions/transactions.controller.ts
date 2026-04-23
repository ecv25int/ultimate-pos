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
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { TransactionType } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.businessId, req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.findAll(req.user.businessId, {
      type: type as TransactionType | undefined,
      status,
      search,
      from,
      to,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  @Get(':id')
  findById(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
  ) {
    return this.transactionsService.findById(
      id,
      req.user.businessId,
      type as TransactionType | undefined,
    );
  }

  @Put(':id')
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, req.user.businessId, dto);
  }

  @Post(':id/finalize')
  finalize(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
  ) {
    return this.transactionsService.finalize(
      id,
      req.user.businessId,
      type as TransactionType | undefined,
    );
  }

  @Post(':id/cancel')
  cancel(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
  ) {
    return this.transactionsService.cancel(
      id,
      req.user.businessId,
      type as TransactionType | undefined,
    );
  }
}