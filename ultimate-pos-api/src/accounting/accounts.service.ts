import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/create-account.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new general ledger account.
   */
  async createAccount(businessId: number, userId: number, dto: CreateAccountDto) {
    const type = await this.prisma.accountType.findFirst({
      where: { id: dto.accountTypeId, businessId },
    });
    if (!type) {
      throw new NotFoundException(`Account type #${dto.accountTypeId} not found`);
    }

    // Check account number uniqueness within business
    const dup = await this.prisma.account.findFirst({
      where: { businessId, accountNumber: dto.accountNumber },
    });
    if (dup) {
      throw new BadRequestException(`Account number "${dto.accountNumber}" is already in use`);
    }

    // Validate parent account if specified
    if (dto.parentId) {
      const parent = await this.prisma.account.findFirst({
        where: { id: dto.parentId, businessId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent account #${dto.parentId} not found`);
      }
    }

    return this.prisma.account.create({
      data: {
        businessId,
        accountTypeId: dto.accountTypeId,
        parentId: dto.parentId ?? null,
        name: dto.name,
        accountNumber: dto.accountNumber,
        note: dto.note ?? null,
        createdBy: userId,
      },
      include: {
        accountType: { select: { id: true, name: true, rootType: true } },
        parent: { select: { id: true, name: true, accountNumber: true } },
      },
    });
  }

  /**
   * Retrieves all accounts for the business.
   */
  async getAccounts(businessId: number, includeBalance = false) {
    const accounts = await this.prisma.account.findMany({
      where: { businessId },
      include: {
        accountType: { select: { id: true, name: true, rootType: true } },
        parent: { select: { id: true, name: true, accountNumber: true } },
      },
      orderBy: [{ accountNumber: 'asc' }],
    });

    if (!includeBalance) return accounts;

    return Promise.all(
      accounts.map(async (acc) => {
        const balance = await this.getAccountBalance(acc.id);
        return { ...acc, balance };
      }),
    );
  }

  /**
   * Retrieves detail of a single account, including its child accounts and balance.
   */
  async getAccount(businessId: number, id: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, businessId },
      include: {
        accountType: true,
        parent: { select: { id: true, name: true, accountNumber: true } },
        children: {
          select: { id: true, name: true, accountNumber: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account #${id} not found`);
    }

    const balance = await this.getAccountBalance(id);
    return { ...account, balance };
  }

  /**
   * Updates an existing account.
   */
  async updateAccount(businessId: number, id: number, dto: UpdateAccountDto) {
    const account = await this.prisma.account.findFirst({
      where: { id, businessId },
    });
    if (!account) {
      throw new NotFoundException(`Account #${id} not found`);
    }

    if (dto.accountTypeId) {
      const type = await this.prisma.accountType.findFirst({
        where: { id: dto.accountTypeId, businessId },
      });
      if (!type) {
        throw new NotFoundException(`Account type #${dto.accountTypeId} not found`);
      }
    }

    if (dto.accountNumber && dto.accountNumber !== account.accountNumber) {
      const dup = await this.prisma.account.findFirst({
        where: { businessId, accountNumber: dto.accountNumber },
      });
      if (dup) {
        throw new BadRequestException(`Account number "${dto.accountNumber}" is already in use`);
      }
    }

    // Hierarchy circular reference protection
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('An account cannot be its own parent');
      }
      const parent = await this.prisma.account.findFirst({
        where: { id: dto.parentId, businessId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent account #${dto.parentId} not found`);
      }

      // Trace ancestry
      let currentParentId: number | null | undefined = dto.parentId;
      while (currentParentId) {
        const parentAcc: { parentId: number | null } | null = await this.prisma.account.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });
        if (parentAcc?.parentId === id) {
          throw new BadRequestException('Circular reference detected in account hierarchy');
        }
        currentParentId = parentAcc?.parentId ?? null;
      }
    }

    return this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.accountTypeId !== undefined && { accountTypeId: dto.accountTypeId }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.isClosed !== undefined && { isClosed: dto.isClosed }),
      },
      include: {
        accountType: { select: { id: true, name: true, rootType: true } },
        parent: { select: { id: true, name: true, accountNumber: true } },
      },
    });
  }

  /**
   * Deactivates (closes) an account.
   */
  async deactivateAccount(accountId: number, businessId: number) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, businessId },
    });
    if (!account) {
      throw new NotFoundException(`Account #${accountId} not found`);
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: { isClosed: true },
    });
  }

  /**
   * Calculates the balance of an account recursively including its sub-accounts.
   */
  async getAccountBalance(accountId: number, asOfDate?: Date): Promise<number> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        accountType: { select: { rootType: true } },
        children: { select: { id: true } },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account #${accountId} not found`);
    }

    const rootType = account.accountType.rootType.toLowerCase();

    // Fetch transactions for this specific account
    const txWhere: Prisma.AccountTransactionWhereInput = { accountId };
    if (asOfDate) {
      txWhere.operationDate = { lte: new Date(asOfDate) };
    }

    const transactions = await this.prisma.accountTransaction.findMany({
      where: txWhere,
      select: { type: true, amount: true },
    });

    let debit = new Decimal(0);
    let credit = new Decimal(0);

    for (const tx of transactions) {
      if (tx.type === 'debit') {
        debit = debit.plus(tx.amount);
      } else {
        credit = credit.plus(tx.amount);
      }
    }

    let localBalance = new Decimal(0);
    // Assets/Expenses: Balance = Debit - Credit
    // Liabilities/Equity/Revenue: Balance = Credit - Debit
    if (['asset', 'expense'].includes(rootType)) {
      localBalance = debit.minus(credit);
    } else {
      localBalance = credit.minus(debit);
    }

    let balanceTotal = localBalance.toNumber();

    // Add children balances recursively
    for (const child of account.children) {
      const childBalance = await this.getAccountBalance(child.id, asOfDate);
      balanceTotal += childBalance;
    }

    return balanceTotal;
  }

  /**
   * Retrieves transactions for a specific account.
   */
  async getAccountTransactions(accountId: number, fromDate?: Date, toDate?: Date) {
    const where: Prisma.AccountTransactionWhereInput = { accountId };
    if (fromDate || toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.operationDate = dateFilter;
    }

    return this.prisma.accountTransaction.findMany({
      where,
      orderBy: { operationDate: 'desc' },
      include: { account: { select: { id: true, name: true, accountNumber: true } } },
    });
  }

  /**
   * Seeds standard range-coded Chart of Accounts for a business location/entity.
   */
  async seedStandardAccounts(businessId: number, userId: number) {
    const types = [
      { name: 'Current Assets', rootType: 'asset' },
      { name: 'Current Liabilities', rootType: 'liability' },
      { name: 'Equity', rootType: 'equity' },
      { name: 'Operating Revenue', rootType: 'revenue' },
      { name: 'Operating Expenses', rootType: 'expense' },
    ];

    const typeMap: Record<string, number> = {};

    for (const t of types) {
      let typeRec = await this.prisma.accountType.findFirst({
        where: { businessId, name: t.name, rootType: t.rootType },
      });
      if (!typeRec) {
        typeRec = await this.prisma.accountType.create({
          data: {
            businessId,
            name: t.name,
            rootType: t.rootType,
          },
        });
      }
      typeMap[t.rootType] = typeRec.id;
    }

    const standardAccounts = [
      // Assets (1000-1999)
      { name: 'Cash', number: '1010', type: 'asset' },
      { name: 'Bank Account', number: '1020', type: 'asset' },
      { name: 'Accounts Receivable', number: '1200', type: 'asset' },
      // Liabilities (2000-2999)
      { name: 'Accounts Payable', number: '2010', type: 'liability' },
      { name: 'Sales Tax Payable', number: '2200', type: 'liability' },
      // Equity (3000-3999)
      { name: 'Share Capital', number: '3010', type: 'equity' },
      { name: 'Retained Earnings', number: '3020', type: 'equity' },
      // Income/Revenue (4000-4999)
      { name: 'Sales Revenue', number: '4010', type: 'revenue' },
      { name: 'Service Revenue', number: '4020', type: 'revenue' },
      // Expenses (5000-6999)
      { name: 'Cost of Goods Sold', number: '5010', type: 'expense' },
      { name: 'Rent Expense', number: '5100', type: 'expense' },
      { name: 'Wages & Salaries', number: '5200', type: 'expense' },
    ];

    const seeded = [];
    for (const acc of standardAccounts) {
      const accountTypeId = typeMap[acc.type];
      if (!accountTypeId) continue;

      let accountRec = await this.prisma.account.findFirst({
        where: { businessId, accountNumber: acc.number },
      });

      if (!accountRec) {
        accountRec = await this.prisma.account.create({
          data: {
            businessId,
            accountTypeId,
            name: acc.name,
            accountNumber: acc.number,
            createdBy: userId,
          },
        });
      }
      seeded.push(accountRec);
    }

    return seeded;
  }
}
