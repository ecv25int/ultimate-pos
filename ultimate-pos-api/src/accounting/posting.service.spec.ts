/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PostingService } from './posting.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from './currency.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('PostingService', () => {
  let service: PostingService;
  let prisma: any;

  const prismaMock = {
    sale: {
      findFirst: jest.fn(),
    },
    purchase: {
      findFirst: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
    },
    stockAdjustment: {
      findFirst: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
    accountTransaction: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMock)),
  };

  const mockCurrencyService = {
    getExchangeRate: jest.fn().mockReturnValue(1.1),
    buildTransactionNote: jest.fn().mockImplementation((desc, cur, amt, rate) => JSON.stringify({
      foreignCurrency: cur,
      foreignAmount: amt,
      exchangeRate: rate,
      description: desc,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CurrencyService, useValue: mockCurrencyService },
      ],
    }).compile();

    service = module.get<PostingService>(PostingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('postSaleToGL', () => {
    const businessId = 1;
    const saleId = 10;

    it('should post a finalized sale to the GL, with AR, Revenue, and Tax split', async () => {
      const saleMock = {
        id: saleId,
        invoiceNo: 'SALE-100',
        status: 'final',
        totalAmount: new Decimal(115),
        taxAmount: new Decimal(15),
        transactionDate: new Date(),
        createdBy: 2,
      };

      prisma.sale.findFirst.mockResolvedValue(saleMock);

      // Account mock responses
      prisma.account.findFirst.mockImplementation(({ where }: any) => {
        const query = where.OR[0].accountNumber;
        if (query === '1200')
          return Promise.resolve({ id: 100, name: 'Accounts Receivable', isClosed: false });
        if (query === '4010')
          return Promise.resolve({ id: 200, name: 'Sales Revenue', isClosed: false });
        if (query === '2200')
          return Promise.resolve({ id: 300, name: 'Sales Tax Payable', isClosed: false });
        return Promise.resolve(null);
      });

      await service.postSaleToGL(businessId, saleId);

      expect(prisma.accountTransaction.deleteMany).toHaveBeenCalledWith({
        where: { subType: 'sale', linkedTransactionId: saleId },
      });
      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(3);

      // Debit AR
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 100,
          type: 'debit',
          subType: 'sale',
          amount: new Decimal(115),
          referenceNo: 'SALE-100',
          operationDate: saleMock.transactionDate,
          note: 'GL post for Sale #SALE-100',
          linkedTransactionId: saleId,
          createdBy: 2,
        },
      });

      // Credit Revenue
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 200,
          type: 'credit',
          subType: 'sale',
          amount: new Decimal(100),
          referenceNo: 'SALE-100',
          operationDate: saleMock.transactionDate,
          note: 'GL post for Sale #SALE-100',
          linkedTransactionId: saleId,
          createdBy: 2,
        },
      });

      // Credit Tax
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(3, {
        data: {
          accountId: 300,
          type: 'credit',
          subType: 'sale',
          amount: new Decimal(15),
          referenceNo: 'SALE-100',
          operationDate: saleMock.transactionDate,
          note: 'GL post for Sale Tax #SALE-100',
          linkedTransactionId: saleId,
          createdBy: 2,
        },
      });
    });

    it('should ignore sale GL posting if status is not final', async () => {
      const saleMock = {
        id: saleId,
        status: 'draft', // draft
      };

      prisma.sale.findFirst.mockResolvedValue(saleMock);

      await service.postSaleToGL(businessId, saleId);

      expect(prisma.accountTransaction.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if a required account mapping is missing', async () => {
      const saleMock = {
        id: saleId,
        status: 'final',
        totalAmount: new Decimal(100),
        taxAmount: new Decimal(0),
      };

      prisma.sale.findFirst.mockResolvedValue(saleMock);
      // AR account missing
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.postSaleToGL(businessId, saleId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if a mapping account is closed', async () => {
      const saleMock = {
        id: saleId,
        status: 'final',
        totalAmount: new Decimal(100),
        taxAmount: new Decimal(0),
      };

      prisma.sale.findFirst.mockResolvedValue(saleMock);
      prisma.account.findFirst.mockResolvedValue({ id: 100, name: 'Closed AR', isClosed: true });

      await expect(service.postSaleToGL(businessId, saleId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('postPurchaseToGL', () => {
    const businessId = 1;
    const purchaseId = 20;

    it('should post a received purchase to the GL, splitting AP, COGS, and Tax', async () => {
      const purchaseMock = {
        id: purchaseId,
        refNo: 'PURCH-100',
        status: 'received',
        totalAmount: new Decimal(230),
        taxAmount: new Decimal(30),
        purchaseDate: new Date(),
        createdBy: 3,
      };

      prisma.purchase.findFirst.mockResolvedValue(purchaseMock);
      prisma.account.findFirst.mockImplementation(({ where }: any) => {
        const query = where.OR[0].accountNumber;
        if (query === '2010')
          return Promise.resolve({ id: 101, name: 'Accounts Payable', isClosed: false });
        if (query === '5010')
          return Promise.resolve({ id: 201, name: 'Cost of Goods Sold', isClosed: false });
        if (query === '2200')
          return Promise.resolve({ id: 301, name: 'Sales Tax Payable', isClosed: false });
        return Promise.resolve(null);
      });

      await service.postPurchaseToGL(businessId, purchaseId);

      expect(prisma.accountTransaction.deleteMany).toHaveBeenCalledWith({
        where: { subType: 'purchase', linkedTransactionId: purchaseId },
      });
      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(3);

      // Credit AP
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 101,
          type: 'credit',
          subType: 'purchase',
          amount: new Decimal(230),
          referenceNo: 'PURCH-100',
          operationDate: purchaseMock.purchaseDate,
          note: 'GL post for Purchase #PURCH-100',
          linkedTransactionId: purchaseId,
          createdBy: 3,
        },
      });

      // Debit COGS
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 201,
          type: 'debit',
          subType: 'purchase',
          amount: new Decimal(200),
          referenceNo: 'PURCH-100',
          operationDate: purchaseMock.purchaseDate,
          note: 'GL post for Purchase #PURCH-100',
          linkedTransactionId: purchaseId,
          createdBy: 3,
        },
      });

      // Debit Input Tax
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(3, {
        data: {
          accountId: 301,
          type: 'debit',
          subType: 'purchase',
          amount: new Decimal(30),
          referenceNo: 'PURCH-100',
          operationDate: purchaseMock.purchaseDate,
          note: 'GL post for Purchase Tax #PURCH-100',
          linkedTransactionId: purchaseId,
          createdBy: 3,
        },
      });
    });
  });

  describe('postPaymentToGL', () => {
    const businessId = 1;
    const paymentId = 50;

    it('should post a sale payment with cash to cash account', async () => {
      const paymentMock = {
        id: paymentId,
        saleId: 10,
        purchaseId: null,
        method: 'cash',
        amount: new Decimal(50),
        referenceNo: 'PAY-10',
        paymentDate: new Date(),
        createdBy: 2,
      };

      prisma.payment.findFirst.mockResolvedValue(paymentMock);
      prisma.account.findFirst.mockImplementation(({ where }: any) => {
        const query = where.OR[0].accountNumber;
        if (query === '1010') return Promise.resolve({ id: 10, name: 'Cash', isClosed: false });
        if (query === '1200')
          return Promise.resolve({ id: 12, name: 'Accounts Receivable', isClosed: false });
        return Promise.resolve(null);
      });

      await service.postPaymentToGL(businessId, paymentId);

      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(2);

      // Debit Cash
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 10,
          type: 'debit',
          subType: 'payment',
          amount: new Decimal(50),
          referenceNo: 'PAY-10',
          operationDate: paymentMock.paymentDate,
          note: 'GL post for Sale Payment #50',
          linkedTransactionId: paymentId,
          createdBy: 2,
        },
      });

      // Credit AR
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 12,
          type: 'credit',
          subType: 'payment',
          amount: new Decimal(50),
          referenceNo: 'PAY-10',
          operationDate: paymentMock.paymentDate,
          note: 'GL post for Sale Payment #50',
          linkedTransactionId: paymentId,
          createdBy: 2,
        },
      });
    });

    it('should post a purchase payment with card to bank account', async () => {
      const paymentMock = {
        id: paymentId,
        saleId: null,
        purchaseId: 20,
        method: 'card',
        amount: new Decimal(150),
        referenceNo: 'PAY-20',
        paymentDate: new Date(),
        createdBy: 3,
      };

      prisma.payment.findFirst.mockResolvedValue(paymentMock);
      prisma.account.findFirst.mockImplementation(({ where }: any) => {
        const query = where.OR[0].accountNumber;
        if (query === '1020')
          return Promise.resolve({ id: 15, name: 'Bank Account', isClosed: false });
        if (query === '2010')
          return Promise.resolve({ id: 25, name: 'Accounts Payable', isClosed: false });
        return Promise.resolve(null);
      });

      await service.postPaymentToGL(businessId, paymentId);

      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(2);

      // Debit AP
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 25,
          type: 'debit',
          subType: 'payment',
          amount: new Decimal(150),
          referenceNo: 'PAY-20',
          operationDate: paymentMock.paymentDate,
          note: 'GL post for Purchase Payment #50',
          linkedTransactionId: paymentId,
          createdBy: 3,
        },
      });

      // Credit Bank
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 15,
          type: 'credit',
          subType: 'payment',
          amount: new Decimal(150),
          referenceNo: 'PAY-20',
          operationDate: paymentMock.paymentDate,
          note: 'GL post for Purchase Payment #50',
          linkedTransactionId: paymentId,
          createdBy: 3,
        },
      });
    });

    it('should post a sale payment with currency conversion if bank/cash is EUR', async () => {
      const paymentMock = {
        id: paymentId,
        saleId: 10,
        purchaseId: null,
        method: 'cash',
        amount: new Decimal(100), // 100 EUR
        referenceNo: 'PAY-10',
        paymentDate: new Date(),
        createdBy: 2,
      };

      prisma.payment.findFirst.mockResolvedValue(paymentMock);
      prisma.account.findFirst.mockImplementation(({ where }: any) => {
        const query = where.OR[0].accountNumber;
        if (query === '1010')
          return Promise.resolve({
            id: 10,
            name: 'Cash',
            isClosed: false,
            accountDetails: JSON.stringify({ currency: 'EUR' }),
          });
        if (query === '1200')
          return Promise.resolve({ id: 12, name: 'Accounts Receivable', isClosed: false });
        return Promise.resolve(null);
      });

      await service.postPaymentToGL(businessId, paymentId);

      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(2);

      // EUR 100 converted to USD using mockCurrencyService.getExchangeRate (1.1) = 110 USD
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 10,
          type: 'debit',
          subType: 'payment',
          amount: new Decimal(110),
          referenceNo: 'PAY-10',
          operationDate: paymentMock.paymentDate,
          note: JSON.stringify({
            foreignCurrency: 'EUR',
            foreignAmount: 100,
            exchangeRate: 1.1,
            description: 'Payment #50 in EUR',
          }),
          linkedTransactionId: paymentId,
          createdBy: 2,
        },
      });

      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 12,
          type: 'credit',
          subType: 'payment',
          amount: new Decimal(110),
          referenceNo: 'PAY-10',
          operationDate: paymentMock.paymentDate,
          note: 'GL post for Sale Payment #50',
          linkedTransactionId: paymentId,
          createdBy: 2,
        },
      });
    });
  });

  describe('postStockAdjustmentToGL', () => {
    const businessId = 1;
    const adjustmentId = 99;

    it('should post a positive stock adjustment (surplus/gain) to the GL', async () => {
      const adjMock = {
        id: adjustmentId,
        referenceNo: 'ADJ-100',
        status: 'received',
        finalisedAt: new Date(),
        createdBy: 1,
        lines: [
          { quantity: new Decimal(5), unitPrice: new Decimal(10) }, // net value +50
        ],
      };

      prisma.stockAdjustment.findFirst.mockResolvedValue(adjMock);
      prisma.account.findFirst.mockImplementation(({ where }: any) => {
        const query = where.OR[0].accountNumber;
        if (query === '1300')
          return Promise.resolve({ id: 13, name: 'Inventory', isClosed: false });
        if (query === '5010')
          return Promise.resolve({ id: 50, name: 'Cost of Goods Sold', isClosed: false });
        return Promise.resolve(null);
      });

      await service.postStockAdjustmentToGL(businessId, adjustmentId);

      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(2);

      // Debit Inventory (asset increase)
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 13,
          type: 'debit',
          subType: 'stock_adjustment',
          amount: new Decimal(50),
          referenceNo: 'ADJ-100',
          operationDate: adjMock.finalisedAt,
          note: 'GL post for Stock Adjustment #99 (Stock Gain)',
          linkedTransactionId: adjustmentId,
          createdBy: 1,
        },
      });

      // Credit COGS (expense decrease/gain)
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 50,
          type: 'credit',
          subType: 'stock_adjustment',
          amount: new Decimal(50),
          referenceNo: 'ADJ-100',
          operationDate: adjMock.finalisedAt,
          note: 'GL post for Stock Adjustment #99 (Stock Gain)',
          linkedTransactionId: adjustmentId,
          createdBy: 1,
        },
      });
    });

    it('should post a negative stock adjustment (loss/damage) to the GL', async () => {
      const adjMock = {
        id: adjustmentId,
        referenceNo: 'ADJ-100',
        status: 'received',
        finalisedAt: new Date(),
        createdBy: 1,
        lines: [
          { quantity: new Decimal(-5), unitPrice: new Decimal(10) }, // net value -50
        ],
      };

      prisma.stockAdjustment.findFirst.mockResolvedValue(adjMock);
      prisma.account.findFirst.mockImplementation(({ where }: any) => {
        const query = where.OR[0].accountNumber;
        if (query === '1300')
          return Promise.resolve({ id: 13, name: 'Inventory', isClosed: false });
        if (query === '5010')
          return Promise.resolve({ id: 50, name: 'Cost of Goods Sold', isClosed: false });
        return Promise.resolve(null);
      });

      await service.postStockAdjustmentToGL(businessId, adjustmentId);

      expect(prisma.accountTransaction.create).toHaveBeenCalledTimes(2);

      // Debit COGS (expense increase)
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          accountId: 50,
          type: 'debit',
          subType: 'stock_adjustment',
          amount: new Decimal(50),
          referenceNo: 'ADJ-100',
          operationDate: adjMock.finalisedAt,
          note: 'GL post for Stock Adjustment #99 (Stock Loss)',
          linkedTransactionId: adjustmentId,
          createdBy: 1,
        },
      });

      // Credit Inventory (asset decrease)
      expect(prisma.accountTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          accountId: 13,
          type: 'credit',
          subType: 'stock_adjustment',
          amount: new Decimal(50),
          referenceNo: 'ADJ-100',
          operationDate: adjMock.finalisedAt,
          note: 'GL post for Stock Adjustment #99 (Stock Loss)',
          linkedTransactionId: adjustmentId,
          createdBy: 1,
        },
      });
    });
  });
});
