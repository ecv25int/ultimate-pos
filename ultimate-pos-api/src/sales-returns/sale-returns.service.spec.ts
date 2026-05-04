import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateSaleReturnUseCase } from './application/use-cases/create-sale-return.use-case';
import { SaleReturnValidatorService } from './domain/sale-return-validator.service';
import type { OriginalSale } from './domain/sale-return.entity';

const validator = new SaleReturnValidatorService();

function makeOriginal(overrides: Partial<OriginalSale> = {}): OriginalSale {
  return {
    id: 1,
    businessId: 1,
    contactId: null,
    invoiceNo: 'SALE-20260501-0001',
    status: 'final',
    type: 'sale',
    totalAmount: 100,
    taxAmount: 10,
    discountAmount: 0,
    lines: [
      { id: 1, productId: 10, quantity: 5, unitPrice: 20, discountAmount: 0, taxAmount: 2, lineTotal: 102 },
      { id: 2, productId: 11, quantity: 3, unitPrice: 10, discountAmount: 0, taxAmount: 0, lineTotal: 30 },
    ],
    ...overrides,
  };
}

describe('SaleReturnValidatorService', () => {
  it('passes when return quantities are within original', () => {
    const result = validator.validate(makeOriginal(), [
      { productId: 10, quantity: 2 },
      { productId: 11, quantity: 1 },
    ]);
    expect(result.valid).toBe(true);
  });

  it('fails when return quantity exceeds original', () => {
    const result = validator.validate(makeOriginal(), [{ productId: 10, quantity: 10 }]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/cannot return 10/i);
  });

  it('fails when sale is not finalized', () => {
    const result = validator.validate(makeOriginal({ status: 'draft' }), [
      { productId: 10, quantity: 1 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/must be finalized/i);
  });

  it('fails when product was not in original sale', () => {
    const result = validator.validate(makeOriginal(), [{ productId: 999, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/was not part of sale/i);
  });

  it('fails when returning a return transaction', () => {
    const result = validator.validate(makeOriginal({ type: 'sale_return' }), [
      { productId: 10, quantity: 1 },
    ]);
    expect(result.valid).toBe(false);
  });

  it('calculates proportional totals correctly', () => {
    const lines = validator.calculateLineTotals(makeOriginal(), [{ productId: 10, quantity: 2 }]);
    expect(lines).toHaveLength(1);
    expect(lines[0].unitPrice).toBe(20);
    expect(lines[0].lineTotal).toBeCloseTo(40.8, 1);
  });
});

describe('CreateSaleReturnUseCase', () => {
  const original = makeOriginal();

  it('creates a return when validation passes', async () => {
    const returnEntity = {
      id: 99,
      businessId: 1,
      invoiceNo: 'RET-20260501-0001',
      returnOfId: 1,
      totalAmount: 40,
      lines: [],
      returnDate: new Date(),
      status: 'return',
      paymentStatus: 'paid',
      contactId: null,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      paidAmount: 40,
      note: 'Return',
      createdBy: 1,
    };
    const repo: any = {
      findOriginalWithLines: jest.fn().mockResolvedValue(original),
      generateInvoiceNo: jest.fn().mockResolvedValue('RET-20260501-0001'),
      create: jest.fn().mockResolvedValue(returnEntity),
    };
    const useCase = new CreateSaleReturnUseCase(repo, validator);
    const result = await useCase.execute(1, 1, 1, { lines: [{ productId: 10, quantity: 2 }] });
    expect(result.returnOfId).toBe(1);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when original sale not found', async () => {
    const repo: any = { findOriginalWithLines: jest.fn().mockResolvedValue(null) };
    const useCase = new CreateSaleReturnUseCase(repo, validator);
    await expect(useCase.execute(99, 1, 1, { lines: [{ productId: 10, quantity: 1 }] })).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when quantities exceed original', async () => {
    const repo: any = { findOriginalWithLines: jest.fn().mockResolvedValue(original) };
    const useCase = new CreateSaleReturnUseCase(repo, validator);
    await expect(
      useCase.execute(1, 1, 1, { lines: [{ productId: 10, quantity: 999 }] }),
    ).rejects.toThrow(BadRequestException);
  });
});
