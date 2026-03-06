import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, CreateExpenseCategoryDto } from './dto/create-expense.dto';
import { UpdateExpenseDto, UpdateExpenseCategoryDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // Expense Categories
  // ──────────────────────────────────────────

  async createCategory(businessId: number, createdBy: number, dto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({
      data: { businessId, createdBy, ...dto },
    });
  }

  async findAllCategories(businessId: number) {
    return this.prisma.expenseCategory.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });
  }

  async updateCategory(businessId: number, id: number, dto: UpdateExpenseCategoryDto) {
    const cat = await this.prisma.expenseCategory.findFirst({ where: { id, businessId, deletedAt: null } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.expenseCategory.update({ where: { id }, data: { ...dto } });
  }

  async removeCategory(businessId: number, id: number) {
    const cat = await this.prisma.expenseCategory.findFirst({ where: { id, businessId, deletedAt: null } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.prisma.expenseCategory.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Category deleted' };
  }

  // ──────────────────────────────────────────
  // Expenses
  // ──────────────────────────────────────────

  private async generateRefNo(businessId: number): Promise<string> {
    const count = await this.prisma.expense.count({ where: { businessId } });
    const date = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    return `EXP-${date}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(businessId: number, createdBy: number, dto: CreateExpenseDto) {
    const refNo = dto.refNo || (await this.generateRefNo(businessId));
    const tax = dto.taxAmount ?? 0;
    const totalAmount = dto.amount + tax;

    return this.prisma.expense.create({
      data: {
        businessId,
        createdBy,
        refNo,
        amount: dto.amount,
        taxAmount: tax,
        totalAmount,
        note: dto.note,
        ...(dto.expenseCategoryId ? { expenseCategoryId: dto.expenseCategoryId } : {}),
        ...(dto.expenseDate ? { expenseDate: new Date(dto.expenseDate) } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async findAll(
    businessId: number,
    opts: {
      search?: string;
      categoryId?: number;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { search, categoryId, from, to, page = 1, limit = 20 } = opts;
    const where: any = { businessId, deletedAt: null };
    if (search) where.OR = [{ refNo: { contains: search } }, { note: { contains: search } }];
    if (categoryId) where.expenseCategoryId = categoryId;
    if (from || to) {
      where.expenseDate = {};
      if (from) where.expenseDate.gte = new Date(from);
      if (to) where.expenseDate.lte = new Date(to);
    }

    const [total, data] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, name: true } } },
      }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(businessId: number, id: number) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, businessId, deletedAt: null },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async update(businessId: number, id: number, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findFirst({ where: { id, businessId, deletedAt: null } });
    if (!expense) throw new NotFoundException('Expense not found');

    const amount = dto.amount ?? Number(expense.amount);
    const taxAmount = dto.taxAmount ?? Number(expense.taxAmount);

    return this.prisma.expense.update({
      where: { id },
      data: {
        amount,
        taxAmount,
        totalAmount: amount + taxAmount,
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.refNo ? { refNo: dto.refNo } : {}),
        ...(dto.expenseCategoryId !== undefined ? { expenseCategoryId: dto.expenseCategoryId } : {}),
        ...(dto.expenseDate ? { expenseDate: new Date(dto.expenseDate) } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async remove(businessId: number, id: number) {
    const expense = await this.prisma.expense.findFirst({ where: { id, businessId, deletedAt: null } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Expense deleted' };
  }

  async getSummary(businessId: number) {
    const [total, aggregate, byCategory] = await Promise.all([
      this.prisma.expense.count({ where: { businessId, deletedAt: null } }),
      this.prisma.expense.aggregate({
        where: { businessId, deletedAt: null },
        _sum: { totalAmount: true, taxAmount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['expenseCategoryId'],
        where: { businessId, deletedAt: null },
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),
    ]);

    const categoryIds = byCategory.map((r) => r.expenseCategoryId).filter(Boolean) as number[];
    const categories = await this.prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    return {
      total,
      totalAmount: Number(aggregate._sum.totalAmount ?? 0),
      totalTax: Number(aggregate._sum.taxAmount ?? 0),
      topCategories: byCategory.map((r) => ({
        categoryId: r.expenseCategoryId,
        categoryName: categories.find((c) => c.id === r.expenseCategoryId)?.name ?? 'Uncategorized',
        total: Number(r._sum.totalAmount ?? 0),
        count: r._count.id,
      })),
    };
  }
}
