import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountTypeDto } from './dto/create-account-type.dto';
import { CreateAccountDto, UpdateAccountDto } from './dto/create-account.dto';
import { CreateAccountTransactionDto } from './dto/create-account-transaction.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // ─── Account Types ───────────────────────────────────────────────

  async createAccountType(businessId: number, userId: number, dto: CreateAccountTypeDto) {
    if (dto.parentAccountTypeId) {
      const parent = await this.prisma.accountType.findFirst({
        where: { id: dto.parentAccountTypeId, businessId },
      });
      if (!parent) throw new NotFoundException('Parent account type not found');
    }
    return this.prisma.accountType.create({
      data: {
        businessId,
        name: dto.name,
        rootType: dto.rootType,
        parentAccountTypeId: dto.parentAccountTypeId ?? null,
      },
    });
  }

  async getAccountTypes(businessId: number) {
    return this.prisma.accountType.findMany({
      where: { businessId },
      include: {
        children: { select: { id: true, name: true, rootType: true } },
        _count: { select: { accounts: true } },
      },
      orderBy: [{ rootType: 'asc' }, { name: 'asc' }],
    });
  }

  async deleteAccountType(businessId: number, id: number) {
    const type = await this.prisma.accountType.findFirst({ where: { id, businessId } });
    if (!type) throw new NotFoundException('Account type not found');
    const acCount = await this.prisma.account.count({ where: { accountTypeId: id } });
    if (acCount > 0) throw new BadRequestException('Cannot delete account type that has accounts');
    await this.prisma.accountType.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ─── Accounts (Chart of Accounts) ────────────────────────────────

  async createAccount(businessId: number, userId: number, dto: CreateAccountDto) {
    const type = await this.prisma.accountType.findFirst({
      where: { id: dto.accountTypeId, businessId },
    });
    if (!type) throw new NotFoundException('Account type not found');
    // uniqueness: account_number within business
    const dup = await this.prisma.account.findFirst({
      where: { businessId, accountNumber: dto.accountNumber },
    });
    if (dup) throw new BadRequestException('Account number already in use');
    return this.prisma.account.create({
      data: {
        businessId,
        accountTypeId: dto.accountTypeId,
        name: dto.name,
        accountNumber: dto.accountNumber,
        note: dto.note,
        createdBy: userId,
      },
      include: { accountType: { select: { id: true, name: true, rootType: true } } },
    });
  }

  async getAccounts(businessId: number, includeBalance = false) {
    const accounts = await this.prisma.account.findMany({
      where: { businessId },
      include: {
        accountType: { select: { id: true, name: true, rootType: true } },
      },
      orderBy: [{ accountNumber: 'asc' }],
    });

    if (!includeBalance) return accounts;

    // attach running balance per account
    return Promise.all(
      accounts.map(async (acc) => {
        const balance = await this.getAccountBalance(acc.id);
        return { ...acc, balance };
      }),
    );
  }

  async getAccount(businessId: number, id: number) {
    const acc = await this.prisma.account.findFirst({
      where: { id, businessId },
      include: { accountType: true },
    });
    if (!acc) throw new NotFoundException('Account not found');
    const balance = await this.getAccountBalance(id);
    return { ...acc, balance };
  }

  async updateAccount(businessId: number, id: number, dto: UpdateAccountDto) {
    const acc = await this.prisma.account.findFirst({ where: { id, businessId } });
    if (!acc) throw new NotFoundException('Account not found');
    if (dto.accountTypeId) {
      const type = await this.prisma.accountType.findFirst({ where: { id: dto.accountTypeId, businessId } });
      if (!type) throw new NotFoundException('Account type not found');
    }
    return this.prisma.account.update({
      where: { id },
      data: { ...dto },
      include: { accountType: { select: { id: true, name: true, rootType: true } } },
    });
  }

  async deleteAccount(businessId: number, id: number) {
    const acc = await this.prisma.account.findFirst({ where: { id, businessId } });
    if (!acc) throw new NotFoundException('Account not found');
    const txCount = await this.prisma.accountTransaction.count({ where: { accountId: id } });
    if (txCount > 0) throw new BadRequestException('Cannot delete account with transactions');
    await this.prisma.account.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ─── Account Balance Helper ───────────────────────────────────────

  private async getAccountBalance(accountId: number): Promise<number> {
    // credit - debit or debit - credit depending on account root type
    const transactions = await this.prisma.accountTransaction.findMany({
      where: { accountId },
      select: { type: true, amount: true },
    });
    // For asset/expense: balance = debit - credit (normal debit balance)
    // For liability/equity/revenue: balance = credit - debit (normal credit balance)
    let debit = new Decimal(0);
    let credit = new Decimal(0);
    for (const tx of transactions) {
      if (tx.type === 'debit') debit = debit.plus(tx.amount);
      else credit = credit.plus(tx.amount);
    }
    return debit.minus(credit).toNumber();
  }

  // ─── Transactions (Ledger) ────────────────────────────────────────

  async createTransaction(businessId: number, userId: number, dto: CreateAccountTransactionDto) {
    // verify account belongs to this business
    const acc = await this.prisma.account.findFirst({
      where: { id: dto.accountId, businessId },
    });
    if (!acc) throw new NotFoundException('Account not found');
    if (acc.isClosed) throw new BadRequestException('Cannot post to a closed account');

    return this.prisma.accountTransaction.create({
      data: {
        accountId: dto.accountId,
        type: dto.type,
        subType: dto.subType ?? null,
        amount: dto.amount,
        referenceNo: dto.referenceNo ?? null,
        operationDate: new Date(dto.operationDate),
        note: dto.note ?? null,
        linkedTransactionId: dto.linkedTransactionId ?? null,
        createdBy: userId,
      },
      include: { account: { select: { id: true, name: true, accountNumber: true } } },
    });
  }

  async getTransactions(
    businessId: number,
    accountId?: number,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 50,
  ) {
    const where: Record<string, any> = {
      account: { businessId },
    };
    if (accountId) where.accountId = accountId;
    if (startDate || endDate) {
      where.operationDate = {};
      if (startDate) where.operationDate.gte = new Date(startDate);
      if (endDate) where.operationDate.lte = new Date(endDate);
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.accountTransaction.findMany({
        where,
        include: { account: { select: { id: true, name: true, accountNumber: true } } },
        orderBy: { operationDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.accountTransaction.count({ where }),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async deleteTransaction(businessId: number, id: number) {
    const tx = await this.prisma.accountTransaction.findFirst({
      where: { id },
      include: { account: { select: { businessId: true } } },
    });
    if (!tx || tx.account.businessId !== businessId)
      throw new NotFoundException('Transaction not found');
    await this.prisma.accountTransaction.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ─── Reports ──────────────────────────────────────────────────────

  /** Trial Balance: all accounts with their current balance */
  async getTrialBalance(businessId: number) {
    const accounts = await this.prisma.account.findMany({
      where: { businessId },
      include: {
        accountType: { select: { name: true, rootType: true } },
        transactions: { select: { type: true, amount: true } },
      },
      orderBy: [{ accountNumber: 'asc' }],
    });

    const rows = accounts.map((acc) => {
      let debit = new Decimal(0);
      let credit = new Decimal(0);
      for (const tx of acc.transactions) {
        if (tx.type === 'debit') debit = debit.plus(tx.amount);
        else credit = credit.plus(tx.amount);
      }
      return {
        id: acc.id,
        accountNumber: acc.accountNumber,
        name: acc.name,
        accountType: acc.accountType.name,
        rootType: acc.accountType.rootType,
        debit: debit.toNumber(),
        credit: credit.toNumber(),
        balance: debit.minus(credit).toNumber(),
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    return { rows, totalDebit, totalCredit };
  }

  /** P&L Statement: revenue - expenses over a date range */
  async getProfitLoss(businessId: number, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const accounts = await this.prisma.account.findMany({
      where: { businessId, accountType: { rootType: { in: ['revenue', 'expense'] } } },
      include: {
        accountType: { select: { name: true, rootType: true } },
        transactions: {
          where: { operationDate: { gte: start, lte: end } },
          select: { type: true, amount: true },
        },
      },
      orderBy: [{ accountNumber: 'asc' }],
    });

    const revenue: any[] = [];
    const expenses: any[] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const acc of accounts) {
      let debit = new Decimal(0);
      let credit = new Decimal(0);
      for (const tx of acc.transactions) {
        if (tx.type === 'debit') debit = debit.plus(tx.amount);
        else credit = credit.plus(tx.amount);
      }
      const balance = credit.minus(debit).toNumber(); // revenue = credit normal balance

      if (acc.accountType.rootType === 'revenue') {
        revenue.push({ id: acc.id, name: acc.name, balance });
        totalRevenue += balance;
      } else {
        const expBalance = debit.minus(credit).toNumber(); // expense = debit normal balance
        expenses.push({ id: acc.id, name: acc.name, balance: expBalance });
        totalExpenses += expBalance;
      }
    }

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      revenue,
      totalRevenue,
      expenses,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }

  /** Balance Sheet: assets vs liabilities + equity */
  async getBalanceSheet(businessId: number) {
    const accounts = await this.prisma.account.findMany({
      where: {
        businessId,
        accountType: { rootType: { in: ['asset', 'liability', 'equity'] } },
      },
      include: {
        accountType: { select: { name: true, rootType: true } },
        transactions: { select: { type: true, amount: true } },
      },
      orderBy: [{ accountNumber: 'asc' }],
    });

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const acc of accounts) {
      let debit = new Decimal(0);
      let credit = new Decimal(0);
      for (const tx of acc.transactions) {
        if (tx.type === 'debit') debit = debit.plus(tx.amount);
        else credit = credit.plus(tx.amount);
      }
      const row = { id: acc.id, name: acc.name, accountNumber: acc.accountNumber, balance: 0 };

      if (acc.accountType.rootType === 'asset') {
        row.balance = debit.minus(credit).toNumber();
        assets.push(row);
        totalAssets += row.balance;
      } else if (acc.accountType.rootType === 'liability') {
        row.balance = credit.minus(debit).toNumber();
        liabilities.push(row);
        totalLiabilities += row.balance;
      } else {
        row.balance = credit.minus(debit).toNumber();
        equity.push(row);
        totalEquity += row.balance;
      }
    }

    return {
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }
}
