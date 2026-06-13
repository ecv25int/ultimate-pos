import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  account: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  accountTransaction: {
    findMany: jest.fn(),
  },
};

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    jest.clearAllMocks();
  });

  describe('getExchangeRate', () => {
    it('should return 1.0 for same currencies', () => {
      expect(service.getExchangeRate('USD', 'USD')).toBe(1.0);
      expect(service.getExchangeRate('EUR', 'EUR')).toBe(1.0);
    });

    it('should calculate deterministic fluctuating rates based on date', () => {
      // Day 15: (15 - 15) * 0.005 = 0. Baseline is 1.10
      const rateDay15 = service.getExchangeRate('EUR', 'USD', '2026-06-15');
      expect(rateDay15).toBeCloseTo(1.10);

      // Day 1: (1 - 15) * 0.005 = -0.07. Baseline is 1.10 -> 1.03
      const rateDay1 = service.getExchangeRate('EUR', 'USD', '2026-06-01');
      expect(rateDay1).toBeCloseTo(1.03);

      // Day 25: (25 - 15) * 0.005 = +0.05. Baseline is 1.10 -> 1.15
      const rateDay25 = service.getExchangeRate('EUR', 'USD', '2026-06-25');
      expect(rateDay25).toBeCloseTo(1.15);
    });
  });

  describe('convertAmount', () => {
    it('should convert amount using explicit rate', () => {
      expect(service.convertAmount(100, 'EUR', 'USD', 1.25)).toBe(125);
    });

    it('should convert amount using date lookup rate', () => {
      // Day 15 rate is 1.10
      expect(service.convertAmount(100, 'EUR', 'USD', undefined, '2026-06-15')).toBeCloseTo(110);
    });
  });

  describe('Note Serialization & Parsing', () => {
    it('should build structured JSON notes for multi-currency transactions', () => {
      const note = service.buildTransactionNote('Payment details', 'EUR', 100, 1.1);
      const parsed = JSON.parse(note);
      expect(parsed.foreignCurrency).toBe('EUR');
      expect(parsed.foreignAmount).toBe(100);
      expect(parsed.exchangeRate).toBe(1.1);
      expect(parsed.description).toBe('Payment details');
    });

    it('should parse structured JSON notes and fallback on plain text notes', () => {
      const plain = service.parseTransactionNote('Plain text note');
      expect(plain.description).toBe('Plain text note');
      expect(plain.foreignCurrency).toBeUndefined();

      const structuredNote = JSON.stringify({
        foreignCurrency: 'GBP',
        foreignAmount: 200,
        exchangeRate: 1.3,
        description: 'Structured payment',
      });
      const parsed = service.parseTransactionNote(structuredNote);
      expect(parsed.foreignCurrency).toBe('GBP');
      expect(parsed.foreignAmount).toBe(200);
      expect(parsed.description).toBe('Structured payment');
    });
  });

  describe('getAccountMultiCurrencyBalance', () => {
    it('should calculate base and foreign balances correctly for normal debit accounts', async () => {
      const mockAccount = {
        id: 10,
        name: 'Cash EUR',
        accountNumber: '1011',
        accountDetails: JSON.stringify({ currency: 'EUR' }),
        accountType: { rootType: 'asset' },
      };
      mockPrismaService.account.findUnique.mockResolvedValueOnce(mockAccount);

      // Setup transactions: Debit 110 USD (EUR 100 @ 1.1), Credit 55 USD (EUR 50 @ 1.1)
      const mockTxs = [
        {
          accountId: 10,
          type: 'debit',
          amount: '110.0000',
          operationDate: new Date('2026-06-15'),
          note: JSON.stringify({ foreignCurrency: 'EUR', foreignAmount: 100, exchangeRate: 1.1 }),
        },
        {
          accountId: 10,
          type: 'credit',
          amount: '55.0000',
          operationDate: new Date('2026-06-15'),
          note: JSON.stringify({ foreignCurrency: 'EUR', foreignAmount: 50, exchangeRate: 1.1 }),
        },
      ];
      mockPrismaService.accountTransaction.findMany.mockResolvedValueOnce(mockTxs);

      const result = await service.getAccountMultiCurrencyBalance(10);
      expect(result.foreignCurrency).toBe('EUR');
      expect(result.baseBalance).toBe(55); // 110 - 55 = 55 USD
      expect(result.foreignBalance).toBe(50); // 100 - 50 = 50 EUR
    });
  });

  describe('calculateUnrealizedGains', () => {
    it('should compute unrealized gains correctly for Asset vs Liability accounts', async () => {
      // Setup Accounts:
      // Account 1: EUR Cash (Asset), Details currency = EUR
      // Account 2: EUR AP (Liability), Details currency = EUR
      const mockAccountsList = [
        {
          id: 1,
          name: 'Cash EUR',
          accountNumber: '1011',
          accountDetails: JSON.stringify({ currency: 'EUR' }),
          accountType: { rootType: 'asset' },
        },
        {
          id: 2,
          name: 'Accounts Payable EUR',
          accountNumber: '2011',
          accountDetails: JSON.stringify({ currency: 'EUR' }),
          accountType: { rootType: 'liability' },
        },
      ];
      mockPrismaService.account.findMany.mockResolvedValueOnce(mockAccountsList);

      // Mock finding account details inside getAccountMultiCurrencyBalance
      mockPrismaService.account.findUnique
        .mockResolvedValueOnce(mockAccountsList[0]) // Call for Account 1
        .mockResolvedValueOnce(mockAccountsList[1]); // Call for Account 2

      // Transactions for Account 1 (Asset): Debit 110 USD, foreign balance 100 EUR
      const mockTxsAcc1 = [
        {
          accountId: 1,
          type: 'debit',
          amount: '110.0000',
          operationDate: new Date('2026-06-15'),
          note: JSON.stringify({ foreignCurrency: 'EUR', foreignAmount: 100, exchangeRate: 1.1 }),
        },
      ];

      // Transactions for Account 2 (Liability): Credit 110 USD, foreign balance 100 EUR
      const mockTxsAcc2 = [
        {
          accountId: 2,
          type: 'credit',
          amount: '110.0000',
          operationDate: new Date('2026-06-15'),
          note: JSON.stringify({ foreignCurrency: 'EUR', foreignAmount: 100, exchangeRate: 1.1 }),
        },
      ];

      mockPrismaService.accountTransaction.findMany
        .mockResolvedValueOnce(mockTxsAcc1) // Call for Account 1
        .mockResolvedValueOnce(mockTxsAcc2); // Call for Account 2

      // We calculate asOfDate = '2026-06-25' (Day 25, rate is 1.15)
      // Asset: Current Value = 100 * 1.15 = 115 USD. Historical = 110 USD. Unrealized Gain = 115 - 110 = +5 USD.
      // Liability: Current Value = 100 * 1.15 = 115 USD. Historical = 110 USD. Unrealized Gain = 110 - 115 = -5 USD.
      const report = await service.calculateUnrealizedGains(1, '2026-06-25');

      const cashItem = report.accounts.find((a) => a.accountId === 1);
      const apItem = report.accounts.find((a) => a.accountId === 2);

      expect(cashItem).toBeDefined();
      expect(cashItem!.unrealizedGain).toBe(5);

      expect(apItem).toBeDefined();
      expect(apItem!.unrealizedGain).toBe(-5);

      expect(report.totalUnrealizedGain).toBe(0); // 5 + (-5) = 0
    });
  });
});
