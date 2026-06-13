/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JournalService } from './journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { JournalLineType } from './dto/create-journal-entry.dto';

describe('JournalService', () => {
  let service: JournalService;
  let prisma: any;

  const prismaMock = {
    journalEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    accountTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMock)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [JournalService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<JournalService>(JournalService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createJournalEntry', () => {
    const businessId = 1;
    const userId = 42;

    it('should create a draft journal entry when accounts exist and are open', async () => {
      const dto = {
        description: 'Test entry',
        referenceNo: 'REF-100',
        entryDate: '2026-06-13T00:00:00.000Z',
        lines: [
          { accountId: 10, type: JournalLineType.DEBIT, amount: 100 },
          { accountId: 11, type: JournalLineType.CREDIT, amount: 100 },
        ],
      };

      prisma.account.findMany.mockResolvedValue([
        { id: 10, name: 'Cash', isClosed: false },
        { id: 11, name: 'Revenue', isClosed: false },
      ]);

      const createdEntryMock = {
        id: 1,
        businessId,
        description: dto.description,
        referenceNo: dto.referenceNo,
        entryDate: new Date(dto.entryDate),
        status: 'draft',
        createdBy: userId,
        lines: [
          { accountId: 10, type: 'debit', amount: new Decimal(100) },
          { accountId: 11, type: 'credit', amount: new Decimal(100) },
        ],
      };

      prisma.journalEntry.create.mockResolvedValue(createdEntryMock);

      const result = await service.createJournalEntry(businessId, userId, dto);

      expect(result).toEqual(createdEntryMock);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [10, 11] },
          businessId,
        },
      });
      expect(prisma.journalEntry.create).toHaveBeenCalledWith({
        data: {
          businessId,
          description: 'Test entry',
          referenceNo: 'REF-100',
          entryDate: new Date(dto.entryDate),
          status: 'draft',
          createdBy: userId,
          lines: {
            create: [
              { accountId: 10, type: 'debit', amount: 100 },
              { accountId: 11, type: 'credit', amount: 100 },
            ],
          },
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  name: true,
                  accountNumber: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw BadRequestException if lines is empty', async () => {
      const dto = {
        lines: [],
      };

      await expect(service.createJournalEntry(businessId, userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if one or more accounts do not exist in business', async () => {
      const dto = {
        lines: [
          { accountId: 10, type: JournalLineType.DEBIT, amount: 100 },
          { accountId: 99, type: JournalLineType.CREDIT, amount: 100 },
        ],
      };

      // Only returns account 10, account 99 is missing/belongs to other business
      prisma.account.findMany.mockResolvedValue([{ id: 10, name: 'Cash', isClosed: false }]);

      await expect(service.createJournalEntry(businessId, userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if any account is closed', async () => {
      const dto = {
        lines: [
          { accountId: 10, type: JournalLineType.DEBIT, amount: 100 },
          { accountId: 11, type: JournalLineType.CREDIT, amount: 100 },
        ],
      };

      prisma.account.findMany.mockResolvedValue([
        { id: 10, name: 'Cash', isClosed: true }, // closed
        { id: 11, name: 'Revenue', isClosed: false },
      ]);

      await expect(service.createJournalEntry(businessId, userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getJournalEntry', () => {
    const businessId = 1;
    const entryId = 100;

    it('should retrieve a journal entry by ID', async () => {
      const entryMock = {
        id: entryId,
        businessId,
        status: 'draft',
        lines: [
          {
            accountId: 10,
            type: 'debit',
            amount: new Decimal(100),
            account: { name: 'Cash', isClosed: false },
          },
        ],
      };

      prisma.journalEntry.findFirst.mockResolvedValue(entryMock);

      const result = await service.getJournalEntry(businessId, entryId);
      expect(result).toEqual(entryMock);
      expect(prisma.journalEntry.findFirst).toHaveBeenCalledWith({
        where: { id: entryId, businessId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if entry is not found', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue(null);

      await expect(service.getJournalEntry(businessId, entryId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('postToLedger', () => {
    const businessId = 1;
    const entryId = 100;

    it('should post a valid balanced journal entry to the general ledger', async () => {
      const entryMock = {
        id: entryId,
        businessId,
        referenceNo: 'REF-100',
        entryDate: new Date('2026-06-13T00:00:00.000Z'),
        description: 'Monthly rent',
        status: 'draft',
        createdBy: 5,
        lines: [
          {
            accountId: 20,
            type: 'debit',
            amount: new Decimal(1200),
            account: { name: 'Rent Expense', isClosed: false },
          },
          {
            accountId: 10,
            type: 'credit',
            amount: new Decimal(1200),
            account: { name: 'Cash', isClosed: false },
          },
        ],
      };

      prisma.journalEntry.findFirst.mockResolvedValue(entryMock);
      prisma.journalEntry.update.mockResolvedValue({ ...entryMock, status: 'posted' });

      const result = await service.postToLedger(businessId, entryId);

      expect(result.status).toBe('posted');
      expect(prisma.journalEntry.update).toHaveBeenCalledWith({
        where: { id: entryId },
        data: { status: 'posted' },
      });
      // Verification of transactions created in general ledger
      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(2);
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 20,
          type: 'debit',
          subType: 'journal',
          amount: new Decimal(1200),
          referenceNo: 'REF-100',
          operationDate: entryMock.entryDate,
          note: 'Monthly rent',
          linkedTransactionId: entryId,
          createdBy: 5,
        },
      });
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 10,
          type: 'credit',
          subType: 'journal',
          amount: new Decimal(1200),
          referenceNo: 'REF-100',
          operationDate: entryMock.entryDate,
          note: 'Monthly rent',
          linkedTransactionId: entryId,
          createdBy: 5,
        },
      });
    });

    it('should throw BadRequestException if journal entry is already posted', async () => {
      const entryMock = {
        id: entryId,
        businessId,
        status: 'posted',
        lines: [],
      };

      prisma.journalEntry.findFirst.mockResolvedValue(entryMock);

      await expect(service.postToLedger(businessId, entryId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if debits and credits are not equal', async () => {
      const entryMock = {
        id: entryId,
        businessId,
        status: 'draft',
        lines: [
          {
            accountId: 20,
            type: 'debit',
            amount: new Decimal(100),
            account: { name: 'Rent', isClosed: false },
          },
          {
            accountId: 10,
            type: 'credit',
            amount: new Decimal(90),
            account: { name: 'Cash', isClosed: false },
          },
        ],
      };

      prisma.journalEntry.findFirst.mockResolvedValue(entryMock);

      await expect(service.postToLedger(businessId, entryId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if any associated account is closed at posting time', async () => {
      const entryMock = {
        id: entryId,
        businessId,
        status: 'draft',
        lines: [
          {
            accountId: 20,
            type: 'debit',
            amount: new Decimal(100),
            account: { name: 'Rent', isClosed: true },
          },
          {
            accountId: 10,
            type: 'credit',
            amount: new Decimal(100),
            account: { name: 'Cash', isClosed: false },
          },
        ],
      };

      prisma.journalEntry.findFirst.mockResolvedValue(entryMock);

      await expect(service.postToLedger(businessId, entryId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reverseEntry', () => {
    const businessId = 1;
    const entryId = 100;
    const revUserId = 99;

    it('should reverse a posted entry, update status to reversed and write opposite ledger transactions', async () => {
      const entryMock = {
        id: entryId,
        businessId,
        referenceNo: 'REF-100',
        description: 'Original description',
        status: 'posted',
        createdBy: 5,
        lines: [
          {
            accountId: 20,
            type: 'debit',
            amount: new Decimal(1200),
            account: { name: 'Rent Expense', isClosed: false },
          },
          {
            accountId: 10,
            type: 'credit',
            amount: new Decimal(1200),
            account: { name: 'Cash', isClosed: false },
          },
        ],
      };

      prisma.journalEntry.findFirst.mockResolvedValue(entryMock);
      prisma.journalEntry.update.mockResolvedValue({ ...entryMock, status: 'reversed' });

      const result = await service.reverseEntry(businessId, entryId, revUserId);

      expect(result.status).toBe('reversed');
      expect(prisma.journalEntry.update).toHaveBeenCalledWith({
        where: { id: entryId },
        data: { status: 'reversed' },
      });
      // Reversal creates opposite ledger transactions (original debit of 1200 on Rent becomes credit of 1200 on Rent)
      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(2);
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 20,
          type: 'credit',
          subType: 'journal_reversal',
          amount: new Decimal(1200),
          referenceNo: 'REV-REF-100',
          operationDate: expect.any(Date),
          note: 'Reversal of Journal Entry #100: Original description',
          linkedTransactionId: entryId,
          createdBy: revUserId,
        },
      });
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 10,
          type: 'debit',
          subType: 'journal_reversal',
          amount: new Decimal(1200),
          referenceNo: 'REV-REF-100',
          operationDate: expect.any(Date),
          note: 'Reversal of Journal Entry #100: Original description',
          linkedTransactionId: entryId,
          createdBy: revUserId,
        },
      });
    });

    it('should throw BadRequestException if journal entry is not posted', async () => {
      const entryMock = {
        id: entryId,
        businessId,
        status: 'draft', // not posted
        lines: [],
      };

      prisma.journalEntry.findFirst.mockResolvedValue(entryMock);

      await expect(service.reverseEntry(businessId, entryId, revUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if any associated account is closed at reversal time', async () => {
      const entryMock = {
        id: entryId,
        businessId,
        status: 'posted',
        lines: [
          {
            accountId: 20,
            type: 'debit',
            amount: new Decimal(100),
            account: { name: 'Rent', isClosed: true },
          },
          {
            accountId: 10,
            type: 'credit',
            amount: new Decimal(100),
            account: { name: 'Cash', isClosed: false },
          },
        ],
      };

      prisma.journalEntry.findFirst.mockResolvedValue(entryMock);

      await expect(service.reverseEntry(businessId, entryId, revUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
