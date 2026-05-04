import { Inject, Injectable } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../../domain/inventory.repository';
import type { IInventoryRepository, ProductStockInfo } from '../../domain/inventory.repository';

@Injectable()
export class GetStockOverviewUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: IInventoryRepository,
  ) {}

  execute(businessId: number, search?: string): Promise<ProductStockInfo[]> {
    return this.repo.getStockOverview(businessId, search);
  }
}
