import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../../domain/inventory.repository';
import type { IInventoryRepository } from '../../domain/inventory.repository';
import type { StockEntry } from '../../domain/stock-entry.entity';

export interface ProductHistoryResult {
  product: { id: number; name: string };
  currentStock: number;
  entries: StockEntry[];
}

@Injectable()
export class GetProductHistoryUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: IInventoryRepository,
  ) {}

  async execute(productId: number, businessId: number, limit = 50): Promise<ProductHistoryResult> {
    const product = await this.repo.findProduct(productId, businessId);
    if (!product) throw new NotFoundException(`Product #${productId} not found`);

    const [entries, currentStock] = await Promise.all([
      this.repo.getProductHistory(productId, businessId, limit),
      this.repo.getStockLevel(productId, businessId),
    ]);

    return { product: { id: product.id, name: product.name }, currentStock, entries };
  }
}
