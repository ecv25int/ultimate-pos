import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockEntry } from './domain/stock-entry.entity';
import { StockValidationService } from './domain/stock-validation.service';
import { CheckAvailabilityUseCase } from './application/use-cases/check-availability.use-case';
import { GetStockLevelUseCase } from './application/use-cases/get-stock-level.use-case';
import { GetStockOverviewUseCase } from './application/use-cases/get-stock-overview.use-case';
import { GetLowStockUseCase } from './application/use-cases/get-low-stock.use-case';
import { GetProductHistoryUseCase } from './application/use-cases/get-product-history.use-case';
import { CreateStockEntryUseCase } from './application/use-cases/create-stock-entry.use-case';
import { DeleteStockEntryUseCase } from './application/use-cases/delete-stock-entry.use-case';

const makeEntry = (
  overrides: Partial<ConstructorParameters<typeof StockEntry>[0]> = {},
): StockEntry =>
  new StockEntry({
    id: 1,
    businessId: 10,
    productId: 5,
    entryType: 'purchase_in',
    quantity: 100,
    unitCost: 10,
    referenceNo: 'PO-001',
    note: null,
    createdBy: 1,
    createdAt: new Date(),
    ...overrides,
  });

const makeProduct = (overrides: any = {}) => ({
  id: 5,
  name: 'Widget A',
  enableStock: true,
  alertQuantity: 10,
  ...overrides,
});

describe('StockEntry entity', () => {
  it('positive quantity is an inflow', () => {
    expect(makeEntry({ quantity: 50 }).isInflow()).toBe(true);
    expect(makeEntry({ quantity: 50 }).isOutflow()).toBe(false);
  });

  it('negative quantity is an outflow', () => {
    expect(makeEntry({ quantity: -10 }).isOutflow()).toBe(true);
    expect(makeEntry({ quantity: -10 }).isInflow()).toBe(false);
  });

  it('adjustment_in and adjustment_out are adjustments', () => {
    expect(makeEntry({ entryType: 'adjustment_in' }).isAdjustment()).toBe(true);
    expect(makeEntry({ entryType: 'adjustment_out' }).isAdjustment()).toBe(true);
    expect(makeEntry({ entryType: 'purchase_in' }).isAdjustment()).toBe(false);
  });
});

describe('StockValidationService', () => {
  const svc = new StockValidationService();

  it('isAvailable returns true when stock >= requested', () => {
    expect(svc.isAvailable(50, 10)).toBe(true);
    expect(svc.isAvailable(10, 10)).toBe(true);
  });

  it('isAvailable returns false when stock < requested', () => {
    expect(svc.isAvailable(5, 10)).toBe(false);
    expect(svc.isAvailable(0, 1)).toBe(false);
  });

  it('isLowStock returns true when stock <= alertQuantity', () => {
    expect(svc.isLowStock(5, 10)).toBe(true);
    expect(svc.isLowStock(10, 10)).toBe(true);
  });

  it('isLowStock returns false when stock > alertQuantity', () => {
    expect(svc.isLowStock(11, 10)).toBe(false);
  });

  it('isOutOfStock returns true when stock <= 0', () => {
    expect(svc.isOutOfStock(0)).toBe(true);
    expect(svc.isOutOfStock(-5)).toBe(true);
    expect(svc.isOutOfStock(1)).toBe(false);
  });
});

describe('CheckAvailabilityUseCase', () => {
  const validator = new StockValidationService();

  const buildRepo = (currentStock: number) =>
    ({
      getStockLevel: jest.fn().mockResolvedValue(currentStock),
    }) as any;

  it('execute returns true when stock is sufficient', async () => {
    const uc = new CheckAvailabilityUseCase(buildRepo(50), validator);
    await expect(uc.execute(5, 10, 30)).resolves.toBe(true);
  });

  it('execute returns false when stock is insufficient', async () => {
    const uc = new CheckAvailabilityUseCase(buildRepo(5), validator);
    await expect(uc.execute(5, 10, 10)).resolves.toBe(false);
  });

  it('assertAvailable resolves when stock is sufficient', async () => {
    const uc = new CheckAvailabilityUseCase(buildRepo(100), validator);
    await expect(uc.assertAvailable(5, 10, 50)).resolves.toBeUndefined();
  });

  it('assertAvailable throws BadRequestException when stock is insufficient', async () => {
    const uc = new CheckAvailabilityUseCase(buildRepo(3), validator);
    await expect(uc.assertAvailable(5, 10, 10)).rejects.toThrow(BadRequestException);
  });
});

describe('GetStockLevelUseCase', () => {
  it('returns current stock level for a known product', async () => {
    const repo: any = {
      findProduct: jest.fn().mockResolvedValue(makeProduct()),
      getStockLevel: jest.fn().mockResolvedValue(42),
    };
    const uc = new GetStockLevelUseCase(repo);
    await expect(uc.execute(5, 10)).resolves.toEqual({ productId: 5, currentStock: 42 });
  });

  it('throws NotFoundException for unknown product', async () => {
    const repo: any = {
      findProduct: jest.fn().mockResolvedValue(null),
      getStockLevel: jest.fn(),
    };
    const uc = new GetStockLevelUseCase(repo);
    await expect(uc.execute(99, 10)).rejects.toThrow(NotFoundException);
    expect(repo.getStockLevel).not.toHaveBeenCalled();
  });
});

describe('GetStockOverviewUseCase', () => {
  it('delegates to repository', async () => {
    const overview = [{ id: 5, name: 'Widget', currentStock: 20, isLowStock: false }];
    const repo: any = { getStockOverview: jest.fn().mockResolvedValue(overview) };
    const uc = new GetStockOverviewUseCase(repo);
    await expect(uc.execute(10, 'wid')).resolves.toBe(overview);
    expect(repo.getStockOverview).toHaveBeenCalledWith(10, 'wid');
  });
});

describe('GetLowStockUseCase', () => {
  it('returns only low-stock items', async () => {
    const items = [{ id: 5, name: 'Low Widget', currentStock: 2, isLowStock: true }];
    const repo: any = { getLowStockItems: jest.fn().mockResolvedValue(items) };
    const uc = new GetLowStockUseCase(repo);
    await expect(uc.execute(10)).resolves.toBe(items);
  });
});

describe('GetProductHistoryUseCase', () => {
  it('returns history and current stock', async () => {
    const entries = [makeEntry({ quantity: 50 }), makeEntry({ quantity: -10 })];
    const repo: any = {
      findProduct: jest.fn().mockResolvedValue(makeProduct()),
      getProductHistory: jest.fn().mockResolvedValue(entries),
      getStockLevel: jest.fn().mockResolvedValue(40),
    };
    const uc = new GetProductHistoryUseCase(repo);
    const result = await uc.execute(5, 10);
    expect(result.currentStock).toBe(40);
    expect(result.entries).toHaveLength(2);
    expect(result.product.id).toBe(5);
  });

  it('throws NotFoundException for unknown product', async () => {
    const repo: any = { findProduct: jest.fn().mockResolvedValue(null) };
    await expect(new GetProductHistoryUseCase(repo).execute(99, 10)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('CreateStockEntryUseCase', () => {
  it('creates entry for stock-enabled product', async () => {
    const entry = makeEntry();
    const repo: any = {
      findProduct: jest.fn().mockResolvedValue(makeProduct()),
      createEntry: jest.fn().mockResolvedValue(entry),
    };
    const uc = new CreateStockEntryUseCase(repo);
    const dto: any = { productId: 5, entryType: 'purchase_in', quantity: 100 };
    await expect(uc.execute(10, 1, dto)).resolves.toBe(entry);
  });

  it('throws NotFoundException when product not found', async () => {
    const repo: any = { findProduct: jest.fn().mockResolvedValue(null) };
    const uc = new CreateStockEntryUseCase(repo);
    await expect(
      uc.execute(10, 1, { productId: 99, entryType: 'purchase_in', quantity: 10 } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when stock tracking is disabled', async () => {
    const repo: any = {
      findProduct: jest.fn().mockResolvedValue(makeProduct({ enableStock: false })),
    };
    const uc = new CreateStockEntryUseCase(repo);
    await expect(
      uc.execute(10, 1, { productId: 5, entryType: 'adjustment_in', quantity: 10 } as any),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('DeleteStockEntryUseCase', () => {
  it('deletes an existing entry', async () => {
    const repo: any = {
      findEntry: jest.fn().mockResolvedValue(makeEntry()),
      deleteEntry: jest.fn().mockResolvedValue(undefined),
    };
    const uc = new DeleteStockEntryUseCase(repo);
    await expect(uc.execute(1, 10)).resolves.toBeUndefined();
    expect(repo.deleteEntry).toHaveBeenCalledWith(1, 10);
  });

  it('throws NotFoundException when entry not found', async () => {
    const repo: any = { findEntry: jest.fn().mockResolvedValue(null), deleteEntry: jest.fn() };
    const uc = new DeleteStockEntryUseCase(repo);
    await expect(uc.execute(99, 10)).rejects.toThrow(NotFoundException);
    expect(repo.deleteEntry).not.toHaveBeenCalled();
  });
});
