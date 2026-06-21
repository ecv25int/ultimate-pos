/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService } from './commission.service';
import { PrismaService } from '../prisma/prisma.service';
import { JournalService } from '../accounting/journal.service';
import { CommissionType } from './dto/commission.dto';
import { JournalLineType } from '../accounting/dto/create-journal-entry.dto';
import { BadRequestException } from '@nestjs/common';

describe('CommissionService', () => {
  let service: CommissionService;
  let prisma: any;
  let journalService: any;

  const prismaMock = {
    sale: {
      findMany: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    accountType: {
      findFirst: jest.fn(),
    },
  };

  const journalServiceMock = {
    createJournalEntry: jest.fn(),
    postToLedger: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JournalService, useValue: journalServiceMock },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
    prisma = module.get<PrismaService>(PrismaService);
    journalService = module.get<JournalService>(JournalService);
  });

  describe('calculateCommission', () => {
    const businessId = 1;
    const salesPersonId = 2;
    const fromDate = new Date('2026-06-01');
    const toDate = new Date('2026-06-30');

    it('should calculate commission on invoice_value successfully', async () => {
      prisma.sale.findMany.mockResolvedValue([
        { id: 101, totalAmount: 100 },
        { id: 102, totalAmount: 250 },
      ]);

      const res = await service.calculateCommission(
        businessId,
        salesPersonId,
        fromDate,
        toDate,
        CommissionType.INVOICE_VALUE,
        10, // 10%
      );

      expect(res).toEqual({
        totalSalesAmount: 350,
        commissionAmount: 35,
        salesCount: 2,
      });
      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        where: {
          businessId,
          createdBy: salesPersonId,
          status: 'final',
          type: 'sale',
          transactionDate: { gte: fromDate, lte: toDate },
          deletedAt: null,
        },
      });
    });

    it('should calculate commission on payment_received successfully', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 201, amount: 80 },
        { id: 202, amount: 120 },
      ]);

      const res = await service.calculateCommission(
        businessId,
        salesPersonId,
        fromDate,
        toDate,
        CommissionType.PAYMENT_RECEIVED,
        5, // 5%
      );

      expect(res).toEqual({
        totalPaymentsAmount: 200,
        commissionAmount: 10,
        paymentsCount: 2,
      });
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: {
          businessId,
          paymentDate: { gte: fromDate, lte: toDate },
          sale: {
            createdBy: salesPersonId,
            status: 'final',
            type: 'sale',
            deletedAt: null,
          },
        },
      });
    });
  });

  describe('getCommissionStatement', () => {
    const businessId = 1;
    const salesPersonId = 2;
    const fromDate = new Date('2026-06-01');
    const toDate = new Date('2026-06-30');

    it('should format statement with details for invoice_value', async () => {
      prisma.sale.findMany.mockResolvedValue([
        { id: 101, invoiceNo: 'INV-1', transactionDate: fromDate, totalAmount: 200 },
      ]);

      const res = await service.getCommissionStatement(
        businessId,
        salesPersonId,
        fromDate,
        toDate,
        CommissionType.INVOICE_VALUE,
        5,
      );

      expect(res.details).toEqual([
        {
          id: 101,
          invoiceNo: 'INV-1',
          transactionDate: fromDate,
          totalAmount: 200,
          commissionAmount: 10,
        },
      ]);
    });
  });

  describe('processCommissionPayment', () => {
    const businessId = 1;
    const userId = 42;

    it('should throw BadRequestException if Commission Expense account type missing when creating expense account', async () => {
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.accountType.findFirst.mockResolvedValue(null);

      await expect(
        service.processCommissionPayment(businessId, userId, {
          salesPersonId: 2,
          amount: 150,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a general ledger entry for commission payment and post it', async () => {
      const expenseAccountMock = { id: 50, name: 'Commission Expense', isClosed: false };
      const assetAccountMock = { id: 10, name: 'Cash', isClosed: false };

      prisma.account.findFirst
        // First lookup: finds Commission Expense
        .mockResolvedValueOnce(expenseAccountMock)
        // Second lookup: finds Cash
        .mockResolvedValueOnce(assetAccountMock);

      const journalEntryMock = { id: 99 };
      journalService.createJournalEntry.mockResolvedValue(journalEntryMock);
      journalService.postToLedger.mockResolvedValue({ ...journalEntryMock, status: 'posted' });

      const res = await service.processCommissionPayment(businessId, userId, {
        salesPersonId: 2,
        amount: 150,
        description: 'Monthly pay',
        referenceNo: 'REF-PAY-2',
      });

      expect(res.status).toBe('posted');
      expect(journalService.createJournalEntry).toHaveBeenCalledWith(
        businessId,
        userId,
        expect.objectContaining({
          description: 'Monthly pay',
          referenceNo: 'REF-PAY-2',
          lines: [
            { accountId: 50, type: JournalLineType.DEBIT, amount: 150 },
            { accountId: 10, type: JournalLineType.CREDIT, amount: 150 },
          ],
        }),
      );
      expect(journalService.postToLedger).toHaveBeenCalledWith(businessId, 99);
    });
  });
});
