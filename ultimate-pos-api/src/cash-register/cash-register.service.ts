import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddTransactionDto,
  CloseRegisterDto,
  CreateCashRegisterDto,
} from './dto/create-cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async openRegister(
    businessId: number,
    userId: number,
    dto: CreateCashRegisterDto,
  ) {
    // Check if user already has an open register
    const existing = await this.prisma.cashRegister.findFirst({
      where: { businessId, userId, status: 'open' },
    });
    if (existing) {
      throw new BadRequestException(
        'You already have an open cash register session',
      );
    }

    const register = await this.prisma.cashRegister.create({
      data: {
        businessId,
        userId,
        status: 'open',
        openingAmount: dto.openingAmount,
        openNote: dto.openNote,
        openedAt: new Date(),
        transactions: {
          create: {
            transactionType: 'opening',
            amount: dto.openingAmount,
            note: dto.openNote ?? 'Opening balance',
            createdBy: userId,
          },
        },
      },
      include: { transactions: true },
    });

    return register;
  }

  async getActiveSession(businessId: number, userId: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { businessId, userId, status: 'open' },
      include: {
        transactions: { orderBy: { createdAt: 'asc' } },
      },
    });
    return register;
  }

  async addTransaction(
    businessId: number,
    registerId: number,
    userId: number,
    dto: AddTransactionDto,
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: registerId, businessId, status: 'open' },
    });

    if (!register) {
      throw new NotFoundException('Open cash register session not found');
    }

    const transaction = await this.prisma.cashRegisterTransaction.create({
      data: {
        cashRegisterId: registerId,
        transactionType: dto.transactionType,
        amount: dto.amount,
        note: dto.note,
        referenceNo: dto.referenceNo,
        createdBy: userId,
      },
    });

    return transaction;
  }

  async closeRegister(
    businessId: number,
    registerId: number,
    userId: number,
    dto: CloseRegisterDto,
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: registerId, businessId, status: 'open' },
      include: { transactions: true },
    });

    if (!register) {
      throw new NotFoundException('Open cash register session not found');
    }

    // Compute expected closing balance: opening + cash_in - cash_out + sale - refund
    let expectedClosingAmount = Number(register.openingAmount);
    for (const txn of register.transactions) {
      switch (txn.transactionType) {
        case 'cash_in':
        case 'sale':
          expectedClosingAmount += Number(txn.amount);
          break;
        case 'cash_out':
        case 'refund':
          expectedClosingAmount -= Number(txn.amount);
          break;
      }
    }
    const discrepancy = Number(dto.closingAmount) - expectedClosingAmount;

    const updated = await this.prisma.cashRegister.update({
      where: { id: registerId },
      data: {
        status: 'closed',
        closingAmount: dto.closingAmount,
        closingNote: dto.closingNote,
        closedAt: new Date(),
        transactions: {
          create: {
            transactionType: 'closing',
            amount: dto.closingAmount,
            note: dto.closingNote ?? 'Closing balance',
            createdBy: userId,
          },
        },
      },
      include: { transactions: { orderBy: { createdAt: 'asc' } } },
    });

    return { ...updated, expectedClosingAmount, discrepancy };
  }

  async findAll(
    businessId: number,
    opts: { page?: number; limit?: number; status?: string },
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (opts.status) where.status = opts.status;

    const [total, registers] = await Promise.all([
      this.prisma.cashRegister.count({ where }),
      this.prisma.cashRegister.findMany({
        where,
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: {
          transactions: { orderBy: { createdAt: 'asc' } },
        },
      }),
    ]);

    return {
      data: registers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(businessId: number, id: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, businessId },
      include: { transactions: { orderBy: { createdAt: 'asc' } } },
    });

    if (!register) {
      throw new NotFoundException('Cash register session not found');
    }

    return register;
  }

  async getSummary(businessId: number) {
    const [openCount, allRegisters] = await Promise.all([
      this.prisma.cashRegister.count({
        where: { businessId, status: 'open' },
      }),
      this.prisma.cashRegister.findMany({
        where: { businessId },
        include: { transactions: true },
      }),
    ]);

    let totalOpenFloat = 0;
    let totalCashIn = 0;
    let totalCashOut = 0;

    for (const reg of allRegisters) {
      if (reg.status === 'open') {
        totalOpenFloat += Number(reg.openingAmount);
        for (const txn of reg.transactions) {
          if (txn.transactionType === 'cash_in') totalCashIn += Number(txn.amount);
          if (txn.transactionType === 'cash_out') totalCashOut += Number(txn.amount);
        }
      }
    }

    return {
      openSessions: openCount,
      totalOpenFloat,
      totalCashIn,
      totalCashOut,
    };
  }
}
