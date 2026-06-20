import { Test, TestingModule } from '@nestjs/testing';
import { CashRegisterService } from './cash-register.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

const mockPrismaService = {
  cashRegister: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  cashRegisterTransaction: {
    create: jest.fn(),
  },
};

describe('CashRegisterService', () => {
  let service: CashRegisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashRegisterService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CashRegisterService>(CashRegisterService);
    jest.clearAllMocks();
  });

  describe('openRegister', () => {
    it('should open a new register if no active session exists', async () => {
      mockPrismaService.cashRegister.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.cashRegister.create.mockResolvedValueOnce({
        id: 1,
        status: 'open',
        openingAmount: new Decimal(100),
      });

      const result = await service.openRegister(1, 2, {
        openingAmount: 100,
        openNote: 'Opened register',
      });

      expect(result.status).toBe('open');
      expect(mockPrismaService.cashRegister.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already has an active register', async () => {
      mockPrismaService.cashRegister.findFirst.mockResolvedValueOnce({ id: 1, status: 'open' });

      await expect(service.openRegister(1, 2, { openingAmount: 100 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addCashIn & addCashOut', () => {
    it('should add a cash_in transaction to an open register', async () => {
      mockPrismaService.cashRegister.findFirst.mockResolvedValueOnce({ id: 1, status: 'open' });
      mockPrismaService.cashRegisterTransaction.create.mockResolvedValueOnce({
        id: 10,
        transactionType: 'cash_in',
        amount: new Decimal(50),
      });

      const result = await service.addCashIn(1, 1, 2, 50, 'Daily deposit');
      expect(result.amount).toEqual(new Decimal(50));
      expect(mockPrismaService.cashRegisterTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionType: 'cash_in',
            amount: 50,
          }),
        }),
      );
    });

    it('should add a cash_out transaction to an open register', async () => {
      mockPrismaService.cashRegister.findFirst.mockResolvedValueOnce({ id: 1, status: 'open' });
      mockPrismaService.cashRegisterTransaction.create.mockResolvedValueOnce({
        id: 11,
        transactionType: 'cash_out',
        amount: new Decimal(20),
      });

      const result = await service.addCashOut(1, 1, 2, 20, 'Vendor pay');
      expect(result.amount).toEqual(new Decimal(20));
      expect(mockPrismaService.cashRegisterTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionType: 'cash_out',
            amount: 20,
          }),
        }),
      );
    });
  });

  describe('closeRegister & reconcileCash', () => {
    it('should close the register and return expected discrepancy', async () => {
      const mockRegister = {
        id: 1,
        status: 'open',
        openingAmount: new Decimal(100),
        transactions: [
          { transactionType: 'opening', amount: new Decimal(100) },
          { transactionType: 'cash_in', amount: new Decimal(50) },
          { transactionType: 'cash_out', amount: new Decimal(20) },
        ],
      };
      mockPrismaService.cashRegister.findFirst.mockResolvedValueOnce(mockRegister);
      mockPrismaService.cashRegister.update.mockResolvedValueOnce({
        id: 1,
        status: 'closed',
        closingAmount: new Decimal(135),
      });

      const result = await service.closeRegister(1, 1, 2, {
        closingAmount: 135,
        closingNote: 'Closed register',
      });

      expect(result.discrepancy).toBe(5);
      expect(result.expectedClosingAmount).toBe(130);
    });

    it('should reconcile cash register using reconcileCash method', async () => {
      const mockRegister = {
        id: 1,
        status: 'open',
        openingAmount: new Decimal(100),
        transactions: [{ transactionType: 'opening', amount: new Decimal(100) }],
      };
      mockPrismaService.cashRegister.findFirst.mockResolvedValueOnce(mockRegister);
      mockPrismaService.cashRegister.findFirst.mockResolvedValueOnce(mockRegister);
      mockPrismaService.cashRegister.update.mockResolvedValueOnce({
        id: 1,
        status: 'closed',
        closingAmount: new Decimal(95),
      });

      const result = await service.reconcileCash(1, 1, 2, 100, 95);

      expect(result.discrepancy).toBe(-5);
      expect(result.expectedClosingAmount).toBe(100);
    });
  });
});
