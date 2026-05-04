import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStateService } from '../domain/transaction-state.service';
import { TRANSACTION_TYPES, TransactionType } from '../domain/transaction-type';
import { Transaction } from '../domain/transaction.entity';
import {
  CreateTransactionData,
  ITransactionRepository,
  PaginatedTransactions,
  TransactionFilters,
  UpdateTransactionData,
} from '../domain/transaction.repository';
import { TransactionMapper } from './transaction.mapper';

const SALE_INCLUDE = { contact: { select: { id: true, name: true } } } as const;
const PURCHASE_INCLUDE = { contact: { select: { id: true, name: true } } } as const;
const EXPENSE_INCLUDE = { category: { select: { id: true, name: true } } } as const;
const TRANSFER_INCLUDE = { product: { select: { id: true, name: true, sku: true } } } as const;
const ADJUSTMENT_INCLUDE = { location: { select: { id: true, name: true } } } as const;

@Injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateService: TransactionStateService,
  ) {}

  async create(data: CreateTransactionData): Promise<Transaction> {
    const {
      type, businessId, userId, refNo, status, contactId, locationId,
      paymentStatus, note, date, totalBeforeTax, taxAmount, discountAmount, totalAmount,
      expenseCategoryId, productId, quantity, fromLocation, toLocation, adjustmentType,
    } = data;

    switch (type) {
      case 'sale': {
        const row = await this.prisma.sale.create({
          data: {
            businessId, contactId: contactId ?? null, invoiceNo: refNo, status,
            paymentStatus: paymentStatus ?? 'due',
            taxAmount, discountAmount, totalAmount, note: note ?? null,
            transactionDate: date, type: 'sale', createdBy: userId,
          },
          include: SALE_INCLUDE,
        });
        return TransactionMapper.fromSale(row);
      }
      case 'purchase': {
        const row = await this.prisma.purchase.create({
          data: {
            businessId, contactId: contactId ?? null, refNo, status,
            paymentStatus: paymentStatus ?? 'due',
            taxAmount, discountAmount, totalAmount, note: note ?? null,
            purchaseDate: date, type: 'purchase', createdBy: userId,
          },
          include: PURCHASE_INCLUDE,
        });
        return TransactionMapper.fromPurchase(row);
      }
      case 'expense': {
        const row = await this.prisma.expense.create({
          data: {
            businessId, expenseCategoryId: expenseCategoryId ?? null,
            refNo, amount: totalBeforeTax, taxAmount, totalAmount,
            note: note ?? null, expenseDate: date, createdBy: userId,
          },
          include: EXPENSE_INCLUDE,
        });
        return TransactionMapper.fromExpense(row);
      }
      case 'stock_transfer': {
        const row = await this.prisma.stockTransfer.create({
          data: {
            businessId, productId: productId!, quantity: quantity!,
            fromLocation: fromLocation!, toLocation: toLocation!,
            referenceNo: refNo, note: note ?? null, status, createdBy: userId,
          },
          include: TRANSFER_INCLUDE,
        });
        return TransactionMapper.fromStockTransfer(row);
      }
      case 'stock_adjustment': {
        const row = await this.prisma.stockAdjustment.create({
          data: {
            businessId, locationId: locationId ?? null, referenceNo: refNo,
            adjustmentType: adjustmentType ?? 'normal',
            totalAmount, note: note ?? null, status,
            finalised: status !== 'draft',
            finalisedAt: status !== 'draft' ? date : null,
            createdBy: userId,
          },
          include: ADJUSTMENT_INCLUDE,
        });
        return TransactionMapper.fromStockAdjustment(row);
      }
    }
  }

  async findById(
    id: number,
    businessId: number,
    type?: TransactionType,
  ): Promise<Transaction | null> {
    const resolvedType = type ?? (await this.inferType(id, businessId));
    if (!resolvedType) return null;

    switch (resolvedType) {
      case 'sale': {
        const row = await this.prisma.sale.findFirst({
          where: { id, businessId, deletedAt: null },
          include: SALE_INCLUDE,
        });
        return row ? TransactionMapper.fromSale(row) : null;
      }
      case 'purchase': {
        const row = await this.prisma.purchase.findFirst({
          where: { id, businessId, deletedAt: null },
          include: PURCHASE_INCLUDE,
        });
        return row ? TransactionMapper.fromPurchase(row) : null;
      }
      case 'expense': {
        const row = await this.prisma.expense.findFirst({
          where: { id, businessId },
          include: EXPENSE_INCLUDE,
        });
        return row ? TransactionMapper.fromExpense(row) : null;
      }
      case 'stock_transfer': {
        const row = await this.prisma.stockTransfer.findFirst({
          where: { id, businessId },
          include: TRANSFER_INCLUDE,
        });
        return row ? TransactionMapper.fromStockTransfer(row) : null;
      }
      case 'stock_adjustment': {
        const row = await this.prisma.stockAdjustment.findFirst({
          where: { id, businessId },
          include: ADJUSTMENT_INCLUDE,
        });
        return row ? TransactionMapper.fromStockAdjustment(row) : null;
      }
    }
  }

  async findAll(
    businessId: number,
    filters: TransactionFilters,
  ): Promise<PaginatedTransactions> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const types = filters.type ? [filters.type] : [...TRANSACTION_TYPES];

    const collections = await Promise.all(
      types.map((type) => this.queryByType(type, businessId, filters)),
    );

    const items = collections
      .flat()
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return {
      data,
      total: items.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
    };
  }

  async update(
    id: number,
    businessId: number,
    data: UpdateTransactionData,
    type?: TransactionType,
  ): Promise<Transaction> {
    const resolvedType = type ?? (await this.inferType(id, businessId));
    if (!resolvedType) throw new NotFoundException(`Transaction #${id} not found`);

    const {
      contactId, locationId, paymentStatus, note, date,
      totalBeforeTax, taxAmount, discountAmount, totalAmount,
      expenseCategoryId, productId, quantity, fromLocation, toLocation, adjustmentType,
    } = data;

    switch (resolvedType) {
      case 'sale':
        await this.prisma.sale.update({
          where: { id },
          data: {
            ...(contactId !== undefined ? { contactId } : {}),
            ...(paymentStatus ? { paymentStatus } : {}),
            ...(note !== undefined ? { note } : {}),
            ...(date ? { transactionDate: date } : {}),
            ...(taxAmount !== undefined ? { taxAmount } : {}),
            ...(discountAmount !== undefined ? { discountAmount } : {}),
            ...(totalAmount !== undefined ? { totalAmount } : {}),
          },
        });
        break;
      case 'purchase':
        await this.prisma.purchase.update({
          where: { id },
          data: {
            ...(contactId !== undefined ? { contactId } : {}),
            ...(paymentStatus ? { paymentStatus } : {}),
            ...(note !== undefined ? { note } : {}),
            ...(date ? { purchaseDate: date } : {}),
            ...(taxAmount !== undefined ? { taxAmount } : {}),
            ...(discountAmount !== undefined ? { discountAmount } : {}),
            ...(totalAmount !== undefined ? { totalAmount } : {}),
          },
        });
        break;
      case 'expense':
        await this.prisma.expense.update({
          where: { id },
          data: {
            ...(expenseCategoryId !== undefined ? { expenseCategoryId } : {}),
            ...(note !== undefined ? { note } : {}),
            ...(date ? { expenseDate: date } : {}),
            ...(totalBeforeTax !== undefined ? { amount: totalBeforeTax } : {}),
            ...(taxAmount !== undefined ? { taxAmount } : {}),
            ...(totalAmount !== undefined ? { totalAmount } : {}),
          },
        });
        break;
      case 'stock_transfer':
        await this.prisma.stockTransfer.update({
          where: { id },
          data: {
            ...(productId !== undefined ? { productId } : {}),
            ...(quantity !== undefined ? { quantity } : {}),
            ...(fromLocation !== undefined ? { fromLocation } : {}),
            ...(toLocation !== undefined ? { toLocation } : {}),
            ...(note !== undefined ? { note } : {}),
          },
        });
        break;
      case 'stock_adjustment':
        await this.prisma.stockAdjustment.update({
          where: { id },
          data: {
            ...(locationId !== undefined ? { locationId } : {}),
            ...(adjustmentType !== undefined ? { adjustmentType } : {}),
            ...(note !== undefined ? { note } : {}),
            ...(totalAmount !== undefined ? { totalAmount } : {}),
          },
        });
        break;
    }

    const updated = await this.findById(id, businessId, resolvedType);
    return updated!;
  }

  async updateStatus(
    id: number,
    businessId: number,
    newStatus: string,
    type?: TransactionType,
  ): Promise<Transaction> {
    const resolvedType = type ?? (await this.inferType(id, businessId));
    if (!resolvedType) throw new NotFoundException(`Transaction #${id} not found`);

    const persistedStatus = newStatus === 'final'
      ? this.stateService.finalStatusForType(resolvedType)
      : newStatus;

    switch (resolvedType) {
      case 'sale':
        await this.prisma.sale.update({ where: { id }, data: { status: persistedStatus } });
        break;
      case 'purchase':
        await this.prisma.purchase.update({ where: { id }, data: { status: persistedStatus } });
        break;
      case 'expense':
        if (persistedStatus === 'cancelled') {
          await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
        }
        break;
      case 'stock_transfer':
        await this.prisma.stockTransfer.update({ where: { id }, data: { status: persistedStatus } });
        break;
      case 'stock_adjustment': {
        const isFinal = ['received', 'final'].includes(persistedStatus);
        await this.prisma.stockAdjustment.update({
          where: { id },
          data: {
            status: persistedStatus,
            finalised: isFinal,
            finalisedAt: isFinal ? new Date() : null,
          },
        });
        break;
      }
    }

    const updated = await this.findById(id, businessId, resolvedType);
    return updated!;
  }

  async inferType(id: number, businessId: number): Promise<TransactionType | null> {
    const [sale, purchase, expense, transfer, adjustment] = await Promise.all([
      this.prisma.sale.findFirst({ where: { id, businessId }, select: { id: true } }),
      this.prisma.purchase.findFirst({ where: { id, businessId }, select: { id: true } }),
      this.prisma.expense.findFirst({ where: { id, businessId }, select: { id: true } }),
      this.prisma.stockTransfer.findFirst({ where: { id, businessId }, select: { id: true } }),
      this.prisma.stockAdjustment.findFirst({ where: { id, businessId }, select: { id: true } }),
    ]);

    if (sale) return 'sale';
    if (purchase) return 'purchase';
    if (expense) return 'expense';
    if (transfer) return 'stock_transfer';
    if (adjustment) return 'stock_adjustment';
    return null;
  }

  async findRefNos(
    type: TransactionType,
    businessId: number,
    prefix: string,
  ): Promise<Array<string | null>> {
    switch (type) {
      case 'sale': {
        const rows = await this.prisma.sale.findMany({
          where: { businessId, invoiceNo: { startsWith: prefix } },
          select: { invoiceNo: true },
        });
        return rows.map((r) => r.invoiceNo);
      }
      case 'purchase': {
        const rows = await this.prisma.purchase.findMany({
          where: { businessId, refNo: { startsWith: prefix } },
          select: { refNo: true },
        });
        return rows.map((r) => r.refNo);
      }
      case 'expense': {
        const rows = await this.prisma.expense.findMany({
          where: { businessId, refNo: { startsWith: prefix } },
          select: { refNo: true },
        });
        return rows.map((r) => r.refNo);
      }
      case 'stock_transfer': {
        const rows = await this.prisma.stockTransfer.findMany({
          where: { businessId, referenceNo: { startsWith: prefix } },
          select: { referenceNo: true },
        });
        return rows.map((r) => r.referenceNo);
      }
      case 'stock_adjustment': {
        const rows = await this.prisma.stockAdjustment.findMany({
          where: { businessId, referenceNo: { startsWith: prefix } },
          select: { referenceNo: true },
        });
        return rows.map((r) => r.referenceNo);
      }
    }
  }

  private async queryByType(
    type: TransactionType,
    businessId: number,
    filters: TransactionFilters,
  ): Promise<Transaction[]> {
    const { status, search, from, to } = filters;

    switch (type) {
      case 'sale': {
        const rows = await this.prisma.sale.findMany({
          where: {
            businessId, deletedAt: null,
            ...(status ? { status } : {}),
            ...(search ? { OR: [
              { invoiceNo: { contains: search } },
              { note: { contains: search } },
              { contact: { name: { contains: search } } },
            ]} : {}),
            ...(from || to ? { transactionDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            }} : {}),
          },
          include: SALE_INCLUDE,
          orderBy: { transactionDate: 'desc' },
        });
        return rows.map(TransactionMapper.fromSale);
      }
      case 'purchase': {
        const rows = await this.prisma.purchase.findMany({
          where: {
            businessId, deletedAt: null,
            ...(status ? { status } : {}),
            ...(search ? { OR: [
              { refNo: { contains: search } },
              { note: { contains: search } },
              { contact: { name: { contains: search } } },
            ]} : {}),
            ...(from || to ? { purchaseDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            }} : {}),
          },
          include: PURCHASE_INCLUDE,
          orderBy: { purchaseDate: 'desc' },
        });
        return rows.map(TransactionMapper.fromPurchase);
      }
      case 'expense': {
        const rows = await this.prisma.expense.findMany({
          where: {
            businessId,
            ...(status === 'cancelled' ? { deletedAt: { not: null } } : { deletedAt: null }),
            ...(search ? { OR: [
              { refNo: { contains: search } },
              { note: { contains: search } },
            ]} : {}),
            ...(from || to ? { expenseDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            }} : {}),
          },
          include: EXPENSE_INCLUDE,
          orderBy: { expenseDate: 'desc' },
        });
        return rows.map(TransactionMapper.fromExpense);
      }
      case 'stock_transfer': {
        const rows = await this.prisma.stockTransfer.findMany({
          where: {
            businessId,
            ...(status ? { status } : {}),
            ...(search ? { OR: [
              { referenceNo: { contains: search } },
              { note: { contains: search } },
              { product: { name: { contains: search } } },
            ]} : {}),
            ...(from || to ? { createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            }} : {}),
          },
          include: TRANSFER_INCLUDE,
          orderBy: { createdAt: 'desc' },
        });
        return rows.map(TransactionMapper.fromStockTransfer);
      }
      case 'stock_adjustment': {
        const rows = await this.prisma.stockAdjustment.findMany({
          where: {
            businessId,
            ...(status ? { status } : {}),
            ...(search ? { OR: [
              { referenceNo: { contains: search } },
              { note: { contains: search } },
            ]} : {}),
            ...(from || to ? { createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            }} : {}),
          },
          include: ADJUSTMENT_INCLUDE,
          orderBy: { createdAt: 'desc' },
        });
        return rows.map(TransactionMapper.fromStockAdjustment);
      }
    }
  }
}
