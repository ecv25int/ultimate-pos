import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTransactionDto,
  TransactionType,
  TRANSACTION_TYPES,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { RefNumberService } from './services/ref-number.service';
import { TransactionStateService } from './services/transaction-state.service';

type TransactionListFilters = {
  type?: TransactionType;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refNumberService: RefNumberService,
    private readonly transactionStateService: TransactionStateService,
  ) {}

  async create(
    businessId: number,
    userId: number,
    dto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    const status = dto.status ?? this.transactionStateService.getDraftStatusForType(dto.type);
    const refNo = await this.generateReferenceNumber(dto.type, businessId);
    const amounts = this.resolveAmounts(dto);
    const date = dto.transactionDate ? new Date(dto.transactionDate) : new Date();

    switch (dto.type) {
      case 'sale': {
        const sale = await this.prisma.sale.create({
          data: {
            businessId,
            contactId: dto.contactId ?? null,
            invoiceNo: refNo,
            status,
            paymentStatus: dto.paymentStatus ?? 'due',
            taxAmount: amounts.taxAmount,
            discountAmount: amounts.discountAmount,
            totalAmount: amounts.totalAmount,
            note: dto.note ?? null,
            transactionDate: date,
            type: 'sale',
            createdBy: userId,
          },
          include: { contact: { select: { id: true, name: true } } },
        });
        return this.mapSale(sale);
      }
      case 'purchase': {
        const purchase = await this.prisma.purchase.create({
          data: {
            businessId,
            contactId: dto.contactId ?? null,
            refNo,
            status,
            paymentStatus: dto.paymentStatus ?? 'due',
            taxAmount: amounts.taxAmount,
            discountAmount: amounts.discountAmount,
            totalAmount: amounts.totalAmount,
            note: dto.note ?? null,
            purchaseDate: date,
            type: 'purchase',
            createdBy: userId,
          },
          include: { contact: { select: { id: true, name: true } } },
        });
        return this.mapPurchase(purchase);
      }
      case 'expense': {
        const expense = await this.prisma.expense.create({
          data: {
            businessId,
            expenseCategoryId: dto.expenseCategoryId ?? null,
            refNo,
            amount: amounts.totalBeforeTax,
            taxAmount: amounts.taxAmount,
            totalAmount: amounts.totalAmount,
            note: dto.note ?? null,
            expenseDate: date,
            createdBy: userId,
          },
          include: { category: { select: { id: true, name: true } } },
        });
        return this.mapExpense(expense);
      }
      case 'stock_transfer': {
        if (!dto.productId || !dto.quantity || !dto.fromLocation || !dto.toLocation) {
          throw new BadRequestException(
            'stock_transfer requires productId, quantity, fromLocation and toLocation',
          );
        }

        const transfer = await this.prisma.stockTransfer.create({
          data: {
            businessId,
            productId: dto.productId,
            quantity: dto.quantity,
            fromLocation: dto.fromLocation,
            toLocation: dto.toLocation,
            referenceNo: refNo,
            note: dto.note ?? null,
            status,
            createdBy: userId,
          },
          include: { product: { select: { id: true, name: true, sku: true } } },
        });
        return this.mapStockTransfer(transfer);
      }
      case 'stock_adjustment': {
        const adjustment = await this.prisma.stockAdjustment.create({
          data: {
            businessId,
            locationId: dto.locationId ?? null,
            referenceNo: refNo,
            adjustmentType: dto.adjustmentType ?? 'normal',
            totalAmount: amounts.totalAmount,
            note: dto.note ?? null,
            status,
            finalised: status !== 'draft',
            finalisedAt: status !== 'draft' ? date : null,
            createdBy: userId,
          },
          include: { location: { select: { id: true, name: true } } },
        });
        return this.mapStockAdjustment(adjustment);
      }
    }
  }

  async findById(
    id: number,
    businessId: number,
    type?: TransactionType,
  ): Promise<TransactionDto> {
    const resolvedType = type ?? (await this.inferType(id, businessId));
    switch (resolvedType) {
      case 'sale': {
        const sale = await this.prisma.sale.findFirst({
          where: { id, businessId, deletedAt: null },
          include: { contact: { select: { id: true, name: true } } },
        });
        if (!sale) throw new NotFoundException(`Sale transaction #${id} not found`);
        return this.mapSale(sale);
      }
      case 'purchase': {
        const purchase = await this.prisma.purchase.findFirst({
          where: { id, businessId, deletedAt: null },
          include: { contact: { select: { id: true, name: true } } },
        });
        if (!purchase) throw new NotFoundException(`Purchase transaction #${id} not found`);
        return this.mapPurchase(purchase);
      }
      case 'expense': {
        const expense = await this.prisma.expense.findFirst({
          where: { id, businessId },
          include: { category: { select: { id: true, name: true } } },
        });
        if (!expense) throw new NotFoundException(`Expense transaction #${id} not found`);
        return this.mapExpense(expense);
      }
      case 'stock_transfer': {
        const transfer = await this.prisma.stockTransfer.findFirst({
          where: { id, businessId },
          include: { product: { select: { id: true, name: true, sku: true } } },
        });
        if (!transfer) throw new NotFoundException(`Stock transfer transaction #${id} not found`);
        return this.mapStockTransfer(transfer);
      }
      case 'stock_adjustment': {
        const adjustment = await this.prisma.stockAdjustment.findFirst({
          where: { id, businessId },
          include: { location: { select: { id: true, name: true } } },
        });
        if (!adjustment) throw new NotFoundException(`Stock adjustment transaction #${id} not found`);
        return this.mapStockAdjustment(adjustment);
      }
    }
  }

  async findAll(
    businessId: number,
    filters: TransactionListFilters = {},
  ): Promise<{ data: TransactionDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const types = filters.type ? [filters.type] : [...TRANSACTION_TYPES];

    const collections = await Promise.all(
      types.map((type) => this.findTransactionsByType(type, businessId, filters)),
    );

    const items = collections
      .flat()
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

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
    dto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const resolvedType = dto.type ?? (await this.inferType(id, businessId));
    const existing = await this.findById(id, businessId, resolvedType);
    this.transactionStateService.assertCanUpdate(existing.status);

    const amounts = this.resolveAmounts(dto, existing);
    const date = dto.transactionDate ? new Date(dto.transactionDate) : new Date(existing.date);

    switch (resolvedType) {
      case 'sale': {
        await this.prisma.sale.update({
          where: { id },
          data: {
            ...(dto.contactId !== undefined ? { contactId: dto.contactId } : {}),
            ...(dto.status ? { status: dto.status } : {}),
            ...(dto.paymentStatus ? { paymentStatus: dto.paymentStatus } : {}),
            ...(dto.note !== undefined ? { note: dto.note } : {}),
            transactionDate: date,
            taxAmount: amounts.taxAmount,
            discountAmount: amounts.discountAmount,
            totalAmount: amounts.totalAmount,
          },
        });
        break;
      }
      case 'purchase': {
        await this.prisma.purchase.update({
          where: { id },
          data: {
            ...(dto.contactId !== undefined ? { contactId: dto.contactId } : {}),
            ...(dto.status ? { status: dto.status } : {}),
            ...(dto.paymentStatus ? { paymentStatus: dto.paymentStatus } : {}),
            ...(dto.note !== undefined ? { note: dto.note } : {}),
            purchaseDate: date,
            taxAmount: amounts.taxAmount,
            discountAmount: amounts.discountAmount,
            totalAmount: amounts.totalAmount,
          },
        });
        break;
      }
      case 'expense': {
        await this.prisma.expense.update({
          where: { id },
          data: {
            ...(dto.expenseCategoryId !== undefined
              ? { expenseCategoryId: dto.expenseCategoryId }
              : {}),
            ...(dto.note !== undefined ? { note: dto.note } : {}),
            expenseDate: date,
            amount: amounts.totalBeforeTax,
            taxAmount: amounts.taxAmount,
            totalAmount: amounts.totalAmount,
          },
        });
        break;
      }
      case 'stock_transfer': {
        await this.prisma.stockTransfer.update({
          where: { id },
          data: {
            ...(dto.productId !== undefined ? { productId: dto.productId } : {}),
            ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
            ...(dto.fromLocation !== undefined ? { fromLocation: dto.fromLocation } : {}),
            ...(dto.toLocation !== undefined ? { toLocation: dto.toLocation } : {}),
            ...(dto.note !== undefined ? { note: dto.note } : {}),
            ...(dto.status ? { status: dto.status } : {}),
          },
        });
        break;
      }
      case 'stock_adjustment': {
        await this.prisma.stockAdjustment.update({
          where: { id },
          data: {
            ...(dto.locationId !== undefined ? { locationId: dto.locationId } : {}),
            ...(dto.adjustmentType !== undefined ? { adjustmentType: dto.adjustmentType } : {}),
            ...(dto.note !== undefined ? { note: dto.note } : {}),
            ...(dto.status ? { status: dto.status } : {}),
            totalAmount: amounts.totalAmount,
          },
        });
        break;
      }
    }

    return this.findById(id, businessId, resolvedType);
  }

  async updateStatus(
    id: number,
    businessId: number,
    newStatus: string,
    type?: TransactionType,
  ): Promise<TransactionDto> {
    const resolvedType = type ?? (await this.inferType(id, businessId));
    const existing = await this.findById(id, businessId, resolvedType);
    this.transactionStateService.assertCanTransition(existing.status, newStatus);
    const persistedStatus = this.mapPersistedStatus(resolvedType, newStatus);

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
      case 'stock_adjustment':
        await this.prisma.stockAdjustment.update({
          where: { id },
          data: {
            status: persistedStatus,
            finalised: ['received', 'final'].includes(newStatus.toLowerCase()),
            finalisedAt: ['received', 'final'].includes(newStatus.toLowerCase()) ? new Date() : null,
          },
        });
        break;
    }

    return this.findById(id, businessId, resolvedType);
  }

  async finalize(id: number, businessId: number, type?: TransactionType) {
    const resolvedType = type ?? (await this.inferType(id, businessId));
    const finalStatus = this.transactionStateService.getFinalStatusForType(resolvedType);
    return this.updateStatus(id, businessId, finalStatus, resolvedType);
  }

  async cancel(id: number, businessId: number, type?: TransactionType) {
    return this.updateStatus(id, businessId, 'cancelled', type);
  }

  async getTotal(id: number, businessId: number, type?: TransactionType): Promise<{ totalAmount: number }> {
    const transaction = await this.findById(id, businessId, type);
    return { totalAmount: transaction.totalAmount };
  }

  async generateReferenceNumber(type: TransactionType, businessId: number): Promise<string> {
    return this.refNumberService.getNextRefNo(type, businessId);
  }

  private async inferType(id: number, businessId: number): Promise<TransactionType> {
    const checks = await Promise.all([
      this.prisma.sale.findFirst({ where: { id, businessId }, select: { id: true } }),
      this.prisma.purchase.findFirst({ where: { id, businessId }, select: { id: true } }),
      this.prisma.expense.findFirst({ where: { id, businessId }, select: { id: true } }),
      this.prisma.stockTransfer.findFirst({ where: { id, businessId }, select: { id: true } }),
      this.prisma.stockAdjustment.findFirst({ where: { id, businessId }, select: { id: true } }),
    ]);

    const index = checks.findIndex(Boolean);
    if (index === -1) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }

    return TRANSACTION_TYPES[index];
  }

  private resolveAmounts(
    dto: Partial<CreateTransactionDto | UpdateTransactionDto>,
    fallback?: TransactionDto,
  ) {
    const totalBeforeTax = dto.totalBeforeTax ?? fallback?.totalBeforeTax ?? 0;
    const taxAmount = dto.taxAmount ?? fallback?.taxAmount ?? 0;
    const discountAmount = dto.discountAmount ?? fallback?.discountAmount ?? 0;
    const totalAmount =
      dto.totalAmount ?? fallback?.totalAmount ?? Math.max(totalBeforeTax + taxAmount - discountAmount, 0);

    return {
      totalBeforeTax,
      taxAmount,
      discountAmount,
      totalAmount,
    };
  }

  private mapPersistedStatus(type: TransactionType, requestedStatus: string): string {
    const status = requestedStatus.toLowerCase();
    if (status !== 'final') {
      return status;
    }

    return this.transactionStateService.getFinalStatusForType(type);
  }

  private async findTransactionsByType(
    type: TransactionType,
    businessId: number,
    filters: TransactionListFilters,
  ): Promise<TransactionDto[]> {
    switch (type) {
      case 'sale': {
        const rows = await this.prisma.sale.findMany({
          where: {
            businessId,
            deletedAt: null,
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.search
              ? {
                  OR: [
                    { invoiceNo: { contains: filters.search } },
                    { note: { contains: filters.search } },
                    { contact: { name: { contains: filters.search } } },
                  ],
                }
              : {}),
            ...(filters.from || filters.to
              ? {
                  transactionDate: {
                    ...(filters.from ? { gte: new Date(filters.from) } : {}),
                    ...(filters.to ? { lte: new Date(filters.to) } : {}),
                  },
                }
              : {}),
          },
          include: { contact: { select: { id: true, name: true } } },
          orderBy: { transactionDate: 'desc' },
        });
        return rows.map((row) => this.mapSale(row));
      }
      case 'purchase': {
        const rows = await this.prisma.purchase.findMany({
          where: {
            businessId,
            deletedAt: null,
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.search
              ? {
                  OR: [
                    { refNo: { contains: filters.search } },
                    { note: { contains: filters.search } },
                    { contact: { name: { contains: filters.search } } },
                  ],
                }
              : {}),
            ...(filters.from || filters.to
              ? {
                  purchaseDate: {
                    ...(filters.from ? { gte: new Date(filters.from) } : {}),
                    ...(filters.to ? { lte: new Date(filters.to) } : {}),
                  },
                }
              : {}),
          },
          include: { contact: { select: { id: true, name: true } } },
          orderBy: { purchaseDate: 'desc' },
        });
        return rows.map((row) => this.mapPurchase(row));
      }
      case 'expense': {
        const rows = await this.prisma.expense.findMany({
          where: {
            businessId,
            ...(filters.status === 'cancelled' ? { deletedAt: { not: null } } : {}),
            ...(filters.status && filters.status !== 'cancelled'
              ? { deletedAt: null }
              : {}),
            ...(filters.search
              ? {
                  OR: [
                    { refNo: { contains: filters.search } },
                    { note: { contains: filters.search } },
                  ],
                }
              : {}),
            ...(filters.from || filters.to
              ? {
                  expenseDate: {
                    ...(filters.from ? { gte: new Date(filters.from) } : {}),
                    ...(filters.to ? { lte: new Date(filters.to) } : {}),
                  },
                }
              : {}),
          },
          include: { category: { select: { id: true, name: true } } },
          orderBy: { expenseDate: 'desc' },
        });
        return rows.map((row) => this.mapExpense(row));
      }
      case 'stock_transfer': {
        const rows = await this.prisma.stockTransfer.findMany({
          where: {
            businessId,
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.search
              ? {
                  OR: [
                    { referenceNo: { contains: filters.search } },
                    { note: { contains: filters.search } },
                    { product: { name: { contains: filters.search } } },
                  ],
                }
              : {}),
            ...(filters.from || filters.to
              ? {
                  createdAt: {
                    ...(filters.from ? { gte: new Date(filters.from) } : {}),
                    ...(filters.to ? { lte: new Date(filters.to) } : {}),
                  },
                }
              : {}),
          },
          include: { product: { select: { id: true, name: true, sku: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((row) => this.mapStockTransfer(row));
      }
      case 'stock_adjustment': {
        const rows = await this.prisma.stockAdjustment.findMany({
          where: {
            businessId,
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.search
              ? {
                  OR: [
                    { referenceNo: { contains: filters.search } },
                    { note: { contains: filters.search } },
                  ],
                }
              : {}),
            ...(filters.from || filters.to
              ? {
                  createdAt: {
                    ...(filters.from ? { gte: new Date(filters.from) } : {}),
                    ...(filters.to ? { lte: new Date(filters.to) } : {}),
                  },
                }
              : {}),
          },
          include: { location: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((row) => this.mapStockAdjustment(row));
      }
    }
  }

  private mapSale(sale: any): TransactionDto {
    const totalAmount = this.toNumber(sale.totalAmount);
    const taxAmount = this.toNumber(sale.taxAmount);
    const discountAmount = this.toNumber(sale.discountAmount);
    return {
      id: sale.id,
      type: 'sale',
      status: sale.status,
      refNo: sale.invoiceNo,
      businessId: sale.businessId,
      contactId: sale.contactId,
      userId: sale.createdBy,
      paymentStatus: sale.paymentStatus,
      date: sale.transactionDate.toISOString(),
      note: sale.note,
      totalBeforeTax: Math.max(totalAmount - taxAmount + discountAmount, 0),
      taxAmount,
      discountAmount,
      totalAmount,
      metadata: {
        invoiceNo: sale.invoiceNo,
        contactName: sale.contact?.name,
      },
    };
  }

  private mapPurchase(purchase: any): TransactionDto {
    const totalAmount = this.toNumber(purchase.totalAmount);
    const taxAmount = this.toNumber(purchase.taxAmount);
    const discountAmount = this.toNumber(purchase.discountAmount);
    return {
      id: purchase.id,
      type: 'purchase',
      status: purchase.status,
      refNo: purchase.refNo,
      businessId: purchase.businessId,
      contactId: purchase.contactId,
      userId: purchase.createdBy,
      paymentStatus: purchase.paymentStatus,
      date: purchase.purchaseDate.toISOString(),
      note: purchase.note,
      totalBeforeTax: Math.max(totalAmount - taxAmount + discountAmount, 0),
      taxAmount,
      discountAmount,
      totalAmount,
      metadata: {
        contactName: purchase.contact?.name,
      },
    };
  }

  private mapExpense(expense: any): TransactionDto {
    const totalAmount = this.toNumber(expense.totalAmount);
    const taxAmount = this.toNumber(expense.taxAmount);
    const amount = this.toNumber(expense.amount);
    return {
      id: expense.id,
      type: 'expense',
      status: expense.deletedAt ? 'cancelled' : 'final',
      refNo: expense.refNo,
      businessId: expense.businessId,
      userId: expense.createdBy,
      date: expense.expenseDate.toISOString(),
      note: expense.note,
      totalBeforeTax: amount,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      metadata: {
        expenseCategoryId: expense.expenseCategoryId,
        expenseCategoryName: expense.category?.name,
      },
    };
  }

  private mapStockTransfer(transfer: any): TransactionDto {
    const totalAmount = this.toNumber(transfer.quantity);
    return {
      id: transfer.id,
      type: 'stock_transfer',
      status: transfer.status,
      refNo: transfer.referenceNo,
      businessId: transfer.businessId,
      userId: transfer.createdBy,
      date: transfer.createdAt.toISOString(),
      note: transfer.note,
      totalBeforeTax: totalAmount,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount,
      metadata: {
        productId: transfer.productId,
        productName: transfer.product?.name,
        fromLocation: transfer.fromLocation,
        toLocation: transfer.toLocation,
      },
    };
  }

  private mapStockAdjustment(adjustment: any): TransactionDto {
    const totalAmount = this.toNumber(adjustment.totalAmount);
    return {
      id: adjustment.id,
      type: 'stock_adjustment',
      status: adjustment.status,
      refNo: adjustment.referenceNo,
      businessId: adjustment.businessId,
      userId: adjustment.createdBy,
      locationId: adjustment.locationId,
      date: adjustment.createdAt.toISOString(),
      note: adjustment.note,
      totalBeforeTax: totalAmount,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount,
      metadata: {
        locationName: adjustment.location?.name,
        adjustmentType: adjustment.adjustmentType,
        finalised: adjustment.finalised,
      },
    };
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return Number(value);
    }
    if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    return Number(value ?? 0);
  }
}