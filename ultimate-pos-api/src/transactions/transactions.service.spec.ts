import { BadRequestException } from '@nestjs/common';
import { RefNumberService } from './services/ref-number.service';
import { TransactionStateService } from './services/transaction-state.service';
import { TransactionsService } from './transactions.service';

describe('RefNumberService', () => {
  it('generates the next monthly reference number from existing refs', async () => {
    const prisma: any = {
      sale: {
        findMany: jest.fn().mockResolvedValue([
          { invoiceNo: 'SALE-202604-0001' },
          { invoiceNo: 'SALE-202604-0002' },
        ]),
      },
    };

    const service = new RefNumberService(prisma);
    const refNo = await service.getNextRefNo('sale', 1);

    expect(refNo).toMatch(/^SALE-\d{6}-0003$/);
  });
});

describe('TransactionStateService', () => {
  it('allows valid transitions and blocks invalid ones', () => {
    const service = new TransactionStateService();
    expect(service.canTransition('draft', 'final')).toBe(true);
    expect(service.canTransition('final', 'draft')).toBe(false);
  });
});

describe('TransactionsService', () => {
  it('prevents editing finalized transactions', async () => {
    const prisma: any = {};
    const refNumberService = { getNextRefNo: jest.fn() } as any;
    const transactionStateService = new TransactionStateService();
    const service = new TransactionsService(
      prisma,
      refNumberService,
      transactionStateService,
    );

    jest
      .spyOn(service, 'findById')
      .mockResolvedValue({
        id: 1,
        type: 'sale',
        status: 'final',
        refNo: 'SALE-202604-0001',
        businessId: 1,
        userId: 1,
        date: new Date().toISOString(),
        totalBeforeTax: 10,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 10,
      } as any);
    jest.spyOn(service as any, 'inferType').mockResolvedValue('sale');

    await expect(service.update(1, 1, { note: 'blocked' })).rejects.toThrow(
      BadRequestException,
    );
  });
});