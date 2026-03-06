import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, CreateExpenseCategoryDto } from './dto/create-expense.dto';
import { UpdateExpenseDto, UpdateExpenseCategoryDto } from './dto/update-expense.dto';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ── Summary ──────────────────────────────────────────────────────────────
  @Get('summary')
  getSummary(@Request() req: any) {
    return this.expensesService.getSummary(req.user.businessId);
  }

  // ── Categories ───────────────────────────────────────────────────────────
  @Get('categories')
  getCategories(@Request() req: any) {
    return this.expensesService.findAllCategories(req.user.businessId);
  }

  @Post('categories')
  createCategory(@Request() req: any, @Body() dto: CreateExpenseCategoryDto) {
    return this.expensesService.createCategory(req.user.businessId, req.user.id, dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    return this.expensesService.updateCategory(req.user.businessId, id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.expensesService.removeCategory(req.user.businessId, id);
  }

  // ── Expenses ─────────────────────────────────────────────────────────────
  @Post()
  create(@Request() req: any, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.businessId, req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expensesService.findAll(req.user.businessId, {
      search,
      categoryId: categoryId ? +categoryId : undefined,
      from,
      to,
      page: page ? +page : 1,
      limit: Math.min(limit ? +limit : 20, 100),
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.expensesService.findOne(req.user.businessId, id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(req.user.businessId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.expensesService.remove(req.user.businessId, id);
  }
}
