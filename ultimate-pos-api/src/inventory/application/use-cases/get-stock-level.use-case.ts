import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../../domain/inventory.repository';
import type { IInventoryRepository } from '../../domain/inventory.repository';

@Injectable()
export class GetStockLevelUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: IInventoryRepository,
  ) {}

  async execute(
    productId: number,
    businessId: number,
  ): Promise<{ productId: number; currentStock: number }> {
    const product = await this.repo.findProduct(productId, businessId);
    if (!product) throw new NotFoundException(`Product #${productId} not found`);
    const currentStock = await this.repo.getStockLevel(productId, businessId);
    return { productId, currentStock };
  }
}
