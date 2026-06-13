/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: any;

  const prismaMock = {
    accountType: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    accountTransaction: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMock)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createAccount', () => {
    it('should create a valid account without parent', async () => {
      prisma.accountType.findFirst.mockResolvedValue({ id: 10, name: 'Assets', rootType: 'asset' });
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.account.create.mockResolvedValue({ id: 100, name: 'Cash' });

      const dto = {
        accountTypeId: 10,
        name: 'Cash',
        accountNumber: '1010',
      };

      const result = await service.createAccount(1, 99, dto);
      expect(result).toEqual({ id: 100, name: 'Cash' });
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          businessId: 1,
          accountTypeId: 10,
          parentId: null,
          name: 'Cash',
          accountNumber: '1010',
          note: null,
          createdBy: 99,
        },
        include: {
          accountType: { select: { id: true, name: true, rootType: true } },
          parent: { select: { id: true, name: true, accountNumber: true } },
        },
      });
    });

    it('should throw NotFoundException if accountType does not exist', async () => {
      prisma.accountType.findFirst.mockResolvedValue(null);

      await expect(
        service.createAccount(1, 99, {
          accountTypeId: 999,
          name: 'Invalid',
          accountNumber: '0000',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if accountNumber is already in use', async () => {
      prisma.accountType.findFirst.mockResolvedValue({ id: 10 });
      prisma.account.findFirst.mockResolvedValue({ id: 101, accountNumber: '1010' });

      await expect(
        service.createAccount(1, 99, {
          accountTypeId: 10,
          name: 'Duplicate Number',
          accountNumber: '1010',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAccount', () => {
    it('should detect direct parent loop and throw BadRequestException', async () => {
      prisma.account.findFirst.mockResolvedValue({ id: 100, parentId: null });

      await expect(service.updateAccount(1, 100, { parentId: 100 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should detect multi-level parent loop and throw BadRequestException', async () => {
      prisma.account.findFirst.mockResolvedValue({ id: 100, parentId: null });
      prisma.account.findUnique.mockResolvedValue({ id: 200, parentId: 100 });

      await expect(service.updateAccount(1, 100, { parentId: 200 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAccountBalance', () => {
    it('should compute debit normal balance for Asset accounts (debit - credit)', async () => {
      prisma.account.findUnique.mockResolvedValue({
        id: 100,
        accountType: { rootType: 'asset' },
        children: [],
      });

      prisma.accountTransaction.findMany.mockResolvedValue([
        { type: 'debit', amount: new Decimal(150) },
        { type: 'credit', amount: new Decimal(50) },
      ]);

      const balance = await service.getAccountBalance(100);
      expect(balance).toBe(100); // 150 - 50
    });

    it('should compute credit normal balance for Liability accounts (credit - debit)', async () => {
      prisma.account.findUnique.mockResolvedValue({
        id: 200,
        accountType: { rootType: 'liability' },
        children: [],
      });

      prisma.accountTransaction.findMany.mockResolvedValue([
        { type: 'debit', amount: new Decimal(30) },
        { type: 'credit', amount: new Decimal(100) },
      ]);

      const balance = await service.getAccountBalance(200);
      expect(balance).toBe(70); // 100 - 30
    });

    it('should calculate balance recursively including all sub-accounts', async () => {
      // Setup parent account (id=100) with child account (id=101)
      prisma.account.findUnique.mockImplementation(({ where }) => {
        if (where.id === 100) {
          return {
            id: 100,
            accountType: { rootType: 'asset' },
            children: [{ id: 101 }],
          };
        }
        if (where.id === 101) {
          return {
            id: 101,
            accountType: { rootType: 'asset' },
            children: [],
          };
        }
        return null;
      });

      prisma.accountTransaction.findMany.mockImplementation(({ where }) => {
        if (where.accountId === 100) {
          return [{ type: 'debit', amount: new Decimal(200) }];
        }
        if (where.accountId === 101) {
          return [{ type: 'debit', amount: new Decimal(50) }];
        }
        return [];
      });

      const balance = await service.getAccountBalance(100);
      expect(balance).toBe(250); // 200 (parent) + 50 (child)
    });
  });

  describe('seedStandardAccounts', () => {
    it('should seed account types and standard accounts successfully', async () => {
      prisma.accountType.findFirst.mockResolvedValue(null);
      prisma.accountType.create.mockImplementation(({ data }) => ({ id: 500, ...data }));
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.account.create.mockImplementation(({ data }) => ({
        id: Math.floor(Math.random() * 1000),
        ...data,
      }));

      const seeded = await service.seedStandardAccounts(1, 99);
      expect(seeded).toHaveLength(13); // Should seed all 13 standard accounts
      expect(prisma.accountType.create).toHaveBeenCalledTimes(5); // 5 root types
      expect(prisma.account.create).toHaveBeenCalledTimes(13);
    });
  });
});
