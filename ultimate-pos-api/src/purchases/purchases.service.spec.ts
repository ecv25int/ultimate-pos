import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Purchase } from './domain/purchase.entity';
import { LandedCostService } from './domain/landed-cost.service';
import { CreatePurchaseUseCase } from './application/use-cases/create-purchase.use-case';
import { FindPurchaseUseCase } from './application/use-cases/find-purchase.use-case';
import { UpdatePurchaseUseCase } from './application/use-cases/update-purchase.use-case';
import { FinalizePurchaseUseCase } from './application/use-cases/finalize-purchase.use-case';
import { DeletePurchaseUseCase } from './application/use-cases/delete-purchase.use-case';
import { CreatePurchaseReturnUseCase } from './application/use-cases/create-purchase-return.use-case';
import { CreatePurchaseDto, PurchaseStatus, PurchaseType } from './dto/create-purchase.dto';

const makePurchase = (
  overrides: Partial<ConstructorParameters<typeof Purchase>[0]> = {},
): Purchase =>
  new Purchase({
    id: 1,
    businessId: 10,
    contactId: null,
    refNo: 'PO-20260504-0001',
    status: 'ordered',
    paymentStatus: 'due',
    type: 'purchase',
    taxAmount: 0,
    discountAmount: 0,
    shippingAmount: 0,
    totalAmount: 100,
    paidAmount: 0,
    note: null,
    purchaseDate: new Date(),
    returnOfId: null,
    createdBy: 1,
    lines: [
      {
        id: 1,
        productId: 5,
        quantity: 10,
        unitCostBefore: 10,
        unitCostAfter: 10,
        discountAmount: 0,
        taxAmount: 0,
        lineTotal: 100,
        note: null,
      },
    ],
    ...overrides,
  });

describe('Purchase entity', () => {
  it('ordered status is not finalized', () => {
    expect(makePurchase({ status: 'ordered' }).isFinalized()).toBe(false);
  });

  it('received status is finalized', () => {
    expect(makePurchase({ status: 'received' }).isFinalized()).toBe(true);
  });

  it('completed status is finalized', () => {
    expect(makePurchase({ status: 'completed' }).isFinalized()).toBe(true);
  });

  it('cancelled status is finalized', () => {
    expect(makePurchase({ status: 'cancelled' }).isFinalized()).toBe(true);
  });

  it('purchase_return type is detected', () => {
    expect(makePurchase({ type: 'purchase_return' }).isReturn()).toBe(true);
    expect(makePurchase({ type: 'purchase' }).isReturn()).toBe(false);
  });

  it('requisition type is detected', () => {
    expect(makePurchase({ type: 'requisition' }).isRequisition()).toBe(true);
  });
});

describe('LandedCostService', () => {
  const svc = new LandedCostService();

  it('allocates freight proportionally by base cost weight', () => {
    // Line 1: 10 × $10 = $100 base, Line 2: 5 × $20 = $100 base → 50/50 split of $100 freight
    const lines = [
      { productId: 1, quantity: 10, unitCostBefore: 10 },
      { productId: 2, quantity: 5, unitCostBefore: 20 },
    ];
    const result = svc.allocate(lines, 100, 0);
    expect(result[0].unitCostAfter).toBeCloseTo(15, 4); // 10 + (50/10)
    expect(result[1].unitCostAfter).toBeCloseTo(30, 4); // 20 + (50/5)
  });

  it('noOverhead keeps unitCostAfter equal to unitCostBefore', () => {
    const lines = [{ productId: 1, quantity: 5, unitCostBefore: 20 }];
    expect(svc.noOverhead(lines)[0].unitCostAfter).toBe(20);
  });
});

describe('CreatePurchaseUseCase', () => {
  const landedCost = new LandedCostService();
  const mockPostingService = {
    postPurchaseToGL: jest.fn().mockResolvedValue(undefined),
  } as any;

  const buildRepo = (overrides: any = {}) => ({
    generateRefNo: jest.fn().mockResolvedValue('PO-20260504-0001'),
    create: jest
      .fn()
      .mockImplementation(async (data: any) =>
        makePurchase({ refNo: data.refNo, totalAmount: data.totalAmount }),
      ),
    ...overrides,
  });

  it('rejects empty lines', async () => {
    const uc = new CreatePurchaseUseCase(buildRepo(), landedCost, mockPostingService);
    const dto = Object.assign(new CreatePurchaseDto(), { lines: [] });
    await expect(uc.execute(10, 1, dto)).rejects.toThrow(BadRequestException);
  });

  it('generates ref no when not provided and creates purchase', async () => {
    const repo = buildRepo();
    const uc = new CreatePurchaseUseCase(repo, landedCost, mockPostingService);
    const dto = Object.assign(new CreatePurchaseDto(), {
      lines: [{ productId: 5, quantity: 10, unitCostBefore: 10 }],
      type: PurchaseType.PURCHASE,
      status: PurchaseStatus.RECEIVED,
    });
    const result = await uc.execute(10, 1, dto);
    expect(repo.generateRefNo).toHaveBeenCalledWith(10);
    expect(repo.create).toHaveBeenCalled();
    expect(result.refNo).toBe('PO-20260504-0001');
  });

  it('uses provided refNo and skips generation', async () => {
    const repo = buildRepo();
    const uc = new CreatePurchaseUseCase(repo, landedCost, mockPostingService);
    const dto = Object.assign(new CreatePurchaseDto(), {
      refNo: 'CUSTOM-001',
      lines: [{ productId: 5, quantity: 2, unitCostBefore: 50 }],
    });
    await uc.execute(10, 1, dto);
    expect(repo.generateRefNo).not.toHaveBeenCalled();
  });
});

describe('FindPurchaseUseCase', () => {
  it('throws NotFoundException when not found', async () => {
    const repo: any = { findById: jest.fn().mockResolvedValue(null) };
    const uc = new FindPurchaseUseCase(repo);
    await expect(uc.execute(99, 10)).rejects.toThrow(NotFoundException);
  });

  it('returns the purchase when found', async () => {
    const purchase = makePurchase();
    const repo: any = { findById: jest.fn().mockResolvedValue(purchase) };
    const uc = new FindPurchaseUseCase(repo);
    await expect(uc.execute(1, 10)).resolves.toBe(purchase);
  });
});

describe('UpdatePurchaseUseCase', () => {
  it('rejects update on finalized purchase', async () => {
    const purchase = makePurchase({ status: 'received' });
    const repo: any = { findById: jest.fn().mockResolvedValue(purchase), update: jest.fn() };
    const uc = new UpdatePurchaseUseCase(repo);
    await expect(uc.execute(1, 10, {})).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('allows update on non-finalized purchase', async () => {
    const purchase = makePurchase({ status: 'ordered' });
    const updated = makePurchase({ status: 'ordered', note: 'changed' });
    const repo: any = {
      findById: jest.fn().mockResolvedValue(purchase),
      update: jest.fn().mockResolvedValue(updated),
    };
    const uc = new UpdatePurchaseUseCase(repo);
    const result = await uc.execute(1, 10, { note: 'changed' });
    expect(result.note).toBe('changed');
  });
});

describe('FinalizePurchaseUseCase', () => {
  const mockPostingService = {
    postPurchaseToGL: jest.fn().mockResolvedValue(undefined),
  } as any;

  it('finalizes an ordered purchase', async () => {
    const purchase = makePurchase({ status: 'ordered' });
    const finalized = makePurchase({ status: 'received' });
    const repo: any = {
      findById: jest.fn().mockResolvedValue(purchase),
      update: jest.fn().mockResolvedValue(finalized),
    };
    const uc = new FinalizePurchaseUseCase(repo, mockPostingService);
    expect((await uc.execute(1, 10)).status).toBe('received');
  });

  it('rejects finalization of already-finalized purchase', async () => {
    const purchase = makePurchase({ status: 'received' });
    const repo: any = { findById: jest.fn().mockResolvedValue(purchase) };
    await expect(
      new FinalizePurchaseUseCase(repo, mockPostingService).execute(1, 10),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('DeletePurchaseUseCase', () => {
  it('soft-deletes a non-finalized purchase', async () => {
    const purchase = makePurchase({ status: 'ordered' });
    const repo: any = {
      findById: jest.fn().mockResolvedValue(purchase),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const uc = new DeletePurchaseUseCase(repo);
    await expect(uc.execute(1, 10)).resolves.toBeUndefined();
    expect(repo.remove).toHaveBeenCalledWith(1, 10);
  });

  it('rejects deletion of a finalized purchase', async () => {
    const purchase = makePurchase({ status: 'received' });
    const repo: any = { findById: jest.fn().mockResolvedValue(purchase), remove: jest.fn() };
    await expect(new DeletePurchaseUseCase(repo).execute(1, 10)).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.remove).not.toHaveBeenCalled();
  });
});

describe('CreatePurchaseReturnUseCase', () => {
  it('rejects return of a return transaction', async () => {
    const purchase = makePurchase({ type: 'purchase_return' });
    const repo: any = { findById: jest.fn().mockResolvedValue(purchase) };
    const uc = new CreatePurchaseReturnUseCase(repo);
    await expect(
      uc.execute(1, 10, 1, { lines: [{ productId: 5, quantity: 2, unitCost: 10 }] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects return quantity exceeding original', async () => {
    const purchase = makePurchase();
    const repo: any = {
      findById: jest.fn().mockResolvedValue(purchase),
      countReturns: jest.fn().mockResolvedValue(0),
    };
    const uc = new CreatePurchaseReturnUseCase(repo);
    await expect(
      uc.execute(1, 10, 1, { lines: [{ productId: 5, quantity: 99, unitCost: 10 }] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates return and sets returnOfId + removeStock', async () => {
    const purchase = makePurchase();
    const returnPurchase = makePurchase({
      type: 'purchase_return',
      status: 'return',
      returnOfId: 1,
    });
    const repo: any = {
      findById: jest.fn().mockResolvedValue(purchase),
      countReturns: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(returnPurchase),
    };
    const uc = new CreatePurchaseReturnUseCase(repo);
    const result = await uc.execute(1, 10, 1, {
      lines: [{ productId: 5, quantity: 3, unitCost: 10 }],
    });
    expect(result.type).toBe('purchase_return');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        returnOfId: 1,
        removeStock: true,
        addStock: false,
      }),
    );
  });
});
