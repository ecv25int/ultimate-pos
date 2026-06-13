import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Payment } from './domain/payment.entity';
import { PaymentStatusService } from './domain/payment-status.service';
import { AddPaymentUseCase } from './application/use-cases/add-payment.use-case';
import { DeletePaymentUseCase } from './application/use-cases/delete-payment.use-case';
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case';
import { FindPaymentUseCase } from './application/use-cases/find-payment.use-case';
import { AddBulkPaymentsUseCase } from './application/use-cases/add-bulk-payments.use-case';
import { CreatePaymentDto } from './dto/create-payment.dto';

const makePayment = (overrides: Partial<ConstructorParameters<typeof Payment>[0]> = {}): Payment =>
  new Payment({
    id: 1,
    businessId: 10,
    saleId: 5,
    purchaseId: null,
    amount: 50,
    method: 'cash',
    referenceNo: null,
    note: null,
    paymentDate: new Date(),
    createdBy: 1,
    ...overrides,
  });

const makeSale = (overrides: any = {}) => ({
  id: 5,
  totalAmount: 100,
  paidAmount: 0,
  ...overrides,
});

describe('Payment entity', () => {
  it('isForSale returns true when saleId is set', () => {
    expect(makePayment({ saleId: 5, purchaseId: null }).isForSale()).toBe(true);
    expect(makePayment({ saleId: null, purchaseId: 3 }).isForSale()).toBe(false);
  });

  it('isForPurchase returns true when purchaseId is set', () => {
    expect(makePayment({ saleId: null, purchaseId: 3 }).isForPurchase()).toBe(true);
    expect(makePayment({ saleId: 5, purchaseId: null }).isForPurchase()).toBe(false);
  });
});

describe('PaymentStatusService', () => {
  const svc = new PaymentStatusService();

  it('returns paid when totalPaid >= totalAmount', () => {
    expect(svc.calculate(100, 100)).toBe('paid');
    expect(svc.calculate(110, 100)).toBe('paid');
  });

  it('returns partial when 0 < totalPaid < totalAmount', () => {
    expect(svc.calculate(50, 100)).toBe('partial');
  });

  it('returns due when totalPaid is 0', () => {
    expect(svc.calculate(0, 100)).toBe('due');
  });

  it('getBalance returns max(0, total - paid)', () => {
    expect(svc.getBalance(100, 60)).toBe(40);
    expect(svc.getBalance(100, 100)).toBe(0);
    expect(svc.getBalance(100, 110)).toBe(0);
  });

  it('wouldOverpay returns true when new payment would exceed total', () => {
    expect(svc.wouldOverpay(50, 60, 100)).toBe(true); // 50+60=110 > 100
  });

  it('wouldOverpay returns false when new payment fits within total', () => {
    expect(svc.wouldOverpay(30, 40, 100)).toBe(false); // 30+40=70 <= 100
  });

  it('wouldOverpay: exact total is not an overpay', () => {
    expect(svc.wouldOverpay(50, 50, 100)).toBe(false);
  });
});

describe('AddPaymentUseCase', () => {
  const statusSvc = new PaymentStatusService();
  const mockPostingService = {
    postPaymentToGL: jest.fn().mockResolvedValue(undefined),
    deletePaymentFromGL: jest.fn().mockResolvedValue(undefined),
  } as any;

  const buildRepo = (overrides: any = {}) => ({
    findSale: jest.fn().mockResolvedValue(makeSale()),
    findPurchase: jest.fn().mockResolvedValue(null),
    getTotalPaid: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation(async (data: any) => makePayment({ amount: data.amount })),
    updateSalePaymentStatus: jest.fn().mockResolvedValue(undefined),
    updatePurchasePaymentStatus: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  it('throws if neither saleId nor purchaseId provided', async () => {
    const uc = new AddPaymentUseCase(buildRepo(), statusSvc, mockPostingService);
    const dto = Object.assign(new CreatePaymentDto(), { amount: 50 });
    await expect(uc.execute(10, 1, dto)).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when sale not found', async () => {
    const uc = new AddPaymentUseCase(
      buildRepo({ findSale: jest.fn().mockResolvedValue(null) }),
      statusSvc,
      mockPostingService,
    );
    const dto = Object.assign(new CreatePaymentDto(), { amount: 50, saleId: 99 });
    await expect(uc.execute(10, 1, dto)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when payment would overpay', async () => {
    const repo = buildRepo({ getTotalPaid: jest.fn().mockResolvedValue(80) });
    const uc = new AddPaymentUseCase(repo, statusSvc, mockPostingService);
    const dto = Object.assign(new CreatePaymentDto(), { amount: 30, saleId: 5 }); // 80+30=110>100
    await expect(uc.execute(10, 1, dto)).rejects.toThrow(BadRequestException);
  });

  it('creates payment and updates sale payment status', async () => {
    const repo = buildRepo({ getTotalPaid: jest.fn().mockResolvedValue(0) });
    const uc = new AddPaymentUseCase(repo, statusSvc, mockPostingService);
    const dto = Object.assign(new CreatePaymentDto(), { amount: 50, saleId: 5 });
    const result = await uc.execute(10, 1, dto);
    expect(result.amount).toBe(50);
    expect(repo.updateSalePaymentStatus).toHaveBeenCalledWith(5, 50, 'partial');
  });

  it('marks sale as paid when full amount is paid', async () => {
    const repo = buildRepo({ getTotalPaid: jest.fn().mockResolvedValue(0) });
    const uc = new AddPaymentUseCase(repo, statusSvc, mockPostingService);
    const dto = Object.assign(new CreatePaymentDto(), { amount: 100, saleId: 5 });
    await uc.execute(10, 1, dto);
    expect(repo.updateSalePaymentStatus).toHaveBeenCalledWith(5, 100, 'paid');
  });
});

describe('FindPaymentUseCase', () => {
  it('returns payment when found', async () => {
    const payment = makePayment();
    const repo: any = { findById: jest.fn().mockResolvedValue(payment) };
    await expect(new FindPaymentUseCase(repo).execute(1, 10)).resolves.toBe(payment);
  });

  it('throws NotFoundException when not found', async () => {
    const repo: any = { findById: jest.fn().mockResolvedValue(null) };
    await expect(new FindPaymentUseCase(repo).execute(99, 10)).rejects.toThrow(NotFoundException);
  });
});

describe('DeletePaymentUseCase', () => {
  const statusSvc = new PaymentStatusService();
  const mockPostingService = {
    deletePaymentFromGL: jest.fn().mockResolvedValue(undefined),
  } as any;

  it('deletes payment and recalculates sale status', async () => {
    const payment = makePayment({ saleId: 5 });
    const repo: any = {
      findById: jest.fn().mockResolvedValue(payment),
      delete: jest.fn().mockResolvedValue(undefined),
      findSale: jest.fn().mockResolvedValue(makeSale()),
      getTotalPaid: jest.fn().mockResolvedValue(0),
      updateSalePaymentStatus: jest.fn().mockResolvedValue(undefined),
      findPurchase: jest.fn(),
    };
    await new DeletePaymentUseCase(repo, statusSvc, mockPostingService).execute(1, 10);
    expect(repo.delete).toHaveBeenCalledWith(1);
    expect(repo.updateSalePaymentStatus).toHaveBeenCalledWith(5, 0, 'due');
  });

  it('throws NotFoundException when payment not found', async () => {
    const repo: any = { findById: jest.fn().mockResolvedValue(null) };
    await expect(new DeletePaymentUseCase(repo, statusSvc, mockPostingService).execute(99, 10)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('GetBalanceUseCase', () => {
  const statusSvc = new PaymentStatusService();

  it('returns correct balance for a sale', async () => {
    const repo: any = {
      findSale: jest.fn().mockResolvedValue(makeSale({ totalAmount: 100 })),
      getTotalPaid: jest.fn().mockResolvedValue(60),
    };
    const result = await new GetBalanceUseCase(repo, statusSvc).forSale(5, 10);
    expect(result.balance).toBe(40);
    expect(result.paymentStatus).toBe('partial');
    expect(result.paidAmount).toBe(60);
  });

  it('throws NotFoundException for unknown sale', async () => {
    const repo: any = { findSale: jest.fn().mockResolvedValue(null) };
    await expect(new GetBalanceUseCase(repo, statusSvc).forSale(99, 10)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when neither saleId nor purchaseId provided', async () => {
    const repo: any = {};
    await expect(new GetBalanceUseCase(repo, statusSvc).execute(10)).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('AddBulkPaymentsUseCase', () => {
  it('throws BadRequestException when no payments provided', async () => {
    const addPayment: any = { execute: jest.fn() };
    await expect(new AddBulkPaymentsUseCase(addPayment).execute(10, 1, [])).rejects.toThrow(
      BadRequestException,
    );
  });

  it('processes each payment sequentially and returns all', async () => {
    const p1 = makePayment({ id: 1, amount: 30 });
    const p2 = makePayment({ id: 2, amount: 70 });
    const addPayment: any = {
      execute: jest.fn().mockResolvedValueOnce(p1).mockResolvedValueOnce(p2),
    };
    const dtos = [
      Object.assign(new CreatePaymentDto(), { amount: 30, saleId: 5 }),
      Object.assign(new CreatePaymentDto(), { amount: 70, saleId: 5 }),
    ];
    const result = await new AddBulkPaymentsUseCase(addPayment).execute(10, 1, dtos);
    expect(result.created).toBe(2);
    expect(result.payments).toHaveLength(2);
  });
});
