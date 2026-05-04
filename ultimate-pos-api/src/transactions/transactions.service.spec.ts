import { NotFoundException } from '@nestjs/common';
import { RefNumberService } from './application/ref-number.service';
import { CancelTransactionUseCase } from './application/use-cases/cancel-transaction.use-case';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { FinalizeTransactionUseCase } from './application/use-cases/finalize-transaction.use-case';
import { UpdateTransactionUseCase } from './application/use-cases/update-transaction.use-case';
import { TransactionStateService } from './domain/transaction-state.service';
import { Transaction } from './domain/transaction.entity';

const stateService = new TransactionStateService();

function makeTransaction(overrides: Partial<ConstructorParameters<typeof Transaction>[0]> = {}): Transaction {
  return new Transaction({
    id: 1, type: 'sale', status: 'draft', refNo: 'SALE-202604-0001',
    businessId: 1, userId: 1, date: new Date(),
    totalBeforeTax: 100, taxAmount: 10, discountAmount: 0, totalAmount: 110,
    ...overrides,
  });
}

describe('TransactionStateService', () => {
  it('allows valid transitions', () => {
    expect(stateService.canTransition('draft', 'final')).toBe(true);
    expect(stateService.canTransition('draft', 'cancelled')).toBe(true);
    expect(stateService.canTransition('final', 'cancelled')).toBe(true);
  });

  it('blocks invalid transitions', () => {
    expect(stateService.canTransition('final', 'draft')).toBe(false);
    expect(stateService.canTransition('cancelled', 'draft')).toBe(false);
    expect(stateService.canTransition('cancelled', 'final')).toBe(false);
  });

  it('throws on illegal transition', () => {
    expect(() => stateService.assertCanTransition('final', 'draft')).toThrow();
  });

  it('returns correct initial status per type', () => {
    expect(stateService.initialStatusForType('sale')).toBe('draft');
    expect(stateService.initialStatusForType('stock_transfer')).toBe('pending');
  });

  it('returns correct final status per type', () => {
    expect(stateService.finalStatusForType('sale')).toBe('final');
    expect(stateService.finalStatusForType('purchase')).toBe('received');
    expect(stateService.finalStatusForType('stock_transfer')).toBe('completed');
  });
});

describe('Transaction entity', () => {
  it('identifies locked statuses correctly', () => {
    expect(makeTransaction({ status: 'final' }).isLocked()).toBe(true);
    expect(makeTransaction({ status: 'received' }).isLocked()).toBe(true);
    expect(makeTransaction({ status: 'cancelled' }).isLocked()).toBe(true);
    expect(makeTransaction({ status: 'draft' }).isLocked()).toBe(false);
    expect(makeTransaction({ status: 'pending' }).isLocked()).toBe(false);
  });
});

describe('RefNumberService', () => {
  it('generates the next monthly reference number', async () => {
    const today = new Date();
    const period = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const repo: any = {
      findRefNos: jest.fn().mockResolvedValue([`SALE-${period}-0001`, `SALE-${period}-0002`]),
    };
    const service = new RefNumberService(repo);
    const refNo = await service.getNextRefNo('sale', 1);
    expect(refNo).toMatch(/^SALE-\d{6}-0003$/);
  });

  it('starts at 0001 when no refs exist', async () => {
    const repo: any = { findRefNos: jest.fn().mockResolvedValue([]) };
    const service = new RefNumberService(repo);
    const refNo = await service.getNextRefNo('sale', 1);
    expect(refNo).toMatch(/^SALE-\d{6}-0001$/);
  });
});

describe('UpdateTransactionUseCase', () => {
  it('prevents editing a finalized transaction', async () => {
    const repo: any = {
      findById: jest.fn().mockResolvedValue(makeTransaction({ status: 'final' })),
      inferType: jest.fn().mockResolvedValue('sale'),
    };
    const useCase = new UpdateTransactionUseCase(repo, stateService);
    await expect(useCase.execute(1, 1, { note: 'blocked' })).rejects.toThrow();
  });
});

describe('FinalizeTransactionUseCase', () => {
  it('finalizes a draft sale to final status', async () => {
    const draft = makeTransaction({ status: 'draft' });
    const finalized = makeTransaction({ status: 'final' });
    const repo: any = {
      findById: jest.fn().mockResolvedValue(draft),
      updateStatus: jest.fn().mockResolvedValue(finalized),
      inferType: jest.fn().mockResolvedValue('sale'),
    };
    const useCase = new FinalizeTransactionUseCase(repo, stateService);
    const result = await useCase.execute(1, 1, 'sale');
    expect(result.status).toBe('final');
  });
});

describe('CancelTransactionUseCase', () => {
  it('cancels a draft transaction', async () => {
    const draft = makeTransaction({ status: 'draft' });
    const cancelled = makeTransaction({ status: 'cancelled' });
    const repo: any = {
      findById: jest.fn().mockResolvedValue(draft),
      updateStatus: jest.fn().mockResolvedValue(cancelled),
      inferType: jest.fn().mockResolvedValue('sale'),
    };
    const useCase = new CancelTransactionUseCase(repo, stateService);
    const result = await useCase.execute(1, 1, 'sale');
    expect(result.status).toBe('cancelled');
  });

  it('cannot cancel an already cancelled transaction', async () => {
    const repo: any = {
      findById: jest.fn().mockResolvedValue(makeTransaction({ status: 'cancelled' })),
      inferType: jest.fn().mockResolvedValue('sale'),
    };
    const useCase = new CancelTransactionUseCase(repo, stateService);
    await expect(useCase.execute(1, 1, 'sale')).rejects.toThrow();
  });

  it('throws when transaction not found', async () => {
    const repo: any = {
      findById: jest.fn().mockResolvedValue(null),
      inferType: jest.fn().mockResolvedValue('sale'),
    };
    const useCase = new CancelTransactionUseCase(repo, stateService);
    await expect(useCase.execute(1, 1, 'sale')).rejects.toThrow(NotFoundException);
  });
});

describe('CreateTransactionUseCase', () => {
  it('creates a sale with a generated ref number', async () => {
    const expected = makeTransaction({ type: 'sale', status: 'draft', refNo: 'SALE-202604-0001' });
    const repo: any = { create: jest.fn().mockResolvedValue(expected), findRefNos: jest.fn().mockResolvedValue([]) };
    const refNumbers = new RefNumberService(repo);
    const useCase = new CreateTransactionUseCase(repo, refNumbers, stateService);
    const result = await useCase.execute(1, 1, { type: 'sale' } as any);
    expect(result.type).toBe('sale');
    expect(result.refNo).toMatch(/^SALE-/);
  });
});
