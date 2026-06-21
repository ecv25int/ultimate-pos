import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JournalService } from '../accounting/journal.service';
import { ProcessCommissionPaymentDto, CommissionType } from './dto/commission.dto';
import { JournalLineType } from '../accounting/dto/create-journal-entry.dto';

@Injectable()
export class CommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalService: JournalService,
  ) {}

  async calculateCommission(
    businessId: number,
    salesPersonId: number,
    fromDate: Date,
    toDate: Date,
    type: CommissionType = CommissionType.INVOICE_VALUE,
    commissionRate: number = 5,
  ) {
    const rateFactor = commissionRate / 100;

    if (type === CommissionType.INVOICE_VALUE) {
      const sales = await this.prisma.sale.findMany({
        where: {
          businessId,
          createdBy: salesPersonId,
          status: 'final',
          type: 'sale',
          transactionDate: {
            gte: fromDate,
            lte: toDate,
          },
          deletedAt: null,
        },
      });

      const totalSalesAmount = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const commissionAmount = totalSalesAmount * rateFactor;

      return {
        totalSalesAmount: Math.round(totalSalesAmount * 10000) / 10000,
        commissionAmount: Math.round(commissionAmount * 10000) / 10000,
        salesCount: sales.length,
      };
    } else {
      const payments = await this.prisma.payment.findMany({
        where: {
          businessId,
          paymentDate: {
            gte: fromDate,
            lte: toDate,
          },
          sale: {
            createdBy: salesPersonId,
            status: 'final',
            type: 'sale',
            deletedAt: null,
          },
        },
      });

      const totalPaymentsAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const commissionAmount = totalPaymentsAmount * rateFactor;

      return {
        totalPaymentsAmount: Math.round(totalPaymentsAmount * 10000) / 10000,
        commissionAmount: Math.round(commissionAmount * 10000) / 10000,
        paymentsCount: payments.length,
      };
    }
  }

  async getCommissionStatement(
    businessId: number,
    salesPersonId: number,
    fromDate: Date,
    toDate: Date,
    type: CommissionType = CommissionType.INVOICE_VALUE,
    commissionRate: number = 5,
  ) {
    const rateFactor = commissionRate / 100;
    const summary = await this.calculateCommission(
      businessId,
      salesPersonId,
      fromDate,
      toDate,
      type,
      commissionRate,
    );

    if (type === CommissionType.INVOICE_VALUE) {
      const sales = await this.prisma.sale.findMany({
        where: {
          businessId,
          createdBy: salesPersonId,
          status: 'final',
          type: 'sale',
          transactionDate: {
            gte: fromDate,
            lte: toDate,
          },
          deletedAt: null,
        },
        orderBy: { transactionDate: 'asc' },
      });

      const details = sales.map((s) => {
        const total = Number(s.totalAmount);
        return {
          id: s.id,
          invoiceNo: s.invoiceNo,
          transactionDate: s.transactionDate,
          totalAmount: total,
          commissionAmount: Math.round(total * rateFactor * 10000) / 10000,
        };
      });

      return {
        salesPersonId,
        fromDate,
        toDate,
        type,
        commissionRate,
        ...summary,
        details,
      };
    } else {
      const payments = await this.prisma.payment.findMany({
        where: {
          businessId,
          paymentDate: {
            gte: fromDate,
            lte: toDate,
          },
          sale: {
            createdBy: salesPersonId,
            status: 'final',
            type: 'sale',
            deletedAt: null,
          },
        },
        include: {
          sale: true,
        },
        orderBy: { paymentDate: 'asc' },
      });

      const details = payments.map((p) => {
        const amount = Number(p.amount);
        return {
          id: p.id,
          paymentDate: p.paymentDate,
          amount,
          invoiceNo: p.sale?.invoiceNo || '',
          commissionAmount: Math.round(amount * rateFactor * 10000) / 10000,
        };
      });

      return {
        salesPersonId,
        fromDate,
        toDate,
        type,
        commissionRate,
        ...summary,
        details,
      };
    }
  }

  async processCommissionPayment(
    businessId: number,
    userId: number,
    dto: ProcessCommissionPaymentDto,
  ) {
    // 1. Resolve or dynamically create/seed Commission Expense account (5020)
    let expenseAccount = await this.prisma.account.findFirst({
      where: {
        businessId,
        OR: [{ accountNumber: '5020' }, { name: 'Commission Expense' }],
      },
    });

    if (!expenseAccount) {
      let expenseType = await this.prisma.accountType.findFirst({
        where: {
          businessId,
          OR: [{ rootType: 'expense' }, { name: { contains: 'expense' } }],
        },
      });

      if (!expenseType) {
        expenseType = await this.prisma.accountType.findFirst({
          where: { businessId },
        });
      }

      if (!expenseType) {
        throw new BadRequestException(
          'Cannot create Commission Expense account because no account types exist for this business',
        );
      }

      expenseAccount = await this.prisma.account.create({
        data: {
          businessId,
          accountTypeId: expenseType.id,
          name: 'Commission Expense',
          accountNumber: '5020',
          createdBy: userId,
        },
      });
    }

    if (expenseAccount.isClosed) {
      throw new BadRequestException('Commission Expense account is closed');
    }

    // 2. Resolve Cash/Bank account
    let assetAccount = null;
    if (dto.bankOrCashAccountId) {
      assetAccount = await this.prisma.account.findFirst({
        where: { id: dto.bankOrCashAccountId, businessId },
      });
      if (!assetAccount) {
        throw new BadRequestException('Specified bank or cash account not found');
      }
    } else {
      assetAccount = await this.prisma.account.findFirst({
        where: {
          businessId,
          OR: [
            { accountNumber: '1010' },
            { name: 'Cash' },
            { accountNumber: '1020' },
            { name: 'Bank Account' },
          ],
        },
      });
    }

    if (!assetAccount) {
      throw new BadRequestException(
        'No default Cash or Bank Account found. Please specify bankOrCashAccountId.',
      );
    }

    if (assetAccount.isClosed) {
      throw new BadRequestException(`Cash/Bank Account "${assetAccount.name}" is closed`);
    }

    // 3. Create double-entry journal lines
    const description =
      dto.description ?? `Commission payment to salesperson #${dto.salesPersonId}`;
    const referenceNo = dto.referenceNo ?? `COMM-${dto.salesPersonId}-${Date.now()}`;
    const entryDate = dto.entryDate ?? new Date().toISOString();

    const journalDto = {
      description,
      referenceNo,
      entryDate,
      lines: [
        {
          accountId: expenseAccount.id,
          type: JournalLineType.DEBIT,
          amount: dto.amount,
        },
        {
          accountId: assetAccount.id,
          type: JournalLineType.CREDIT,
          amount: dto.amount,
        },
      ],
    };

    // 4. Create and post
    const entry = await this.journalService.createJournalEntry(businessId, userId, journalDto);
    const posted = await this.journalService.postToLedger(businessId, entry.id);

    return posted;
  }
}
