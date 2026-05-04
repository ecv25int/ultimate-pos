import { Inject, Injectable } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../../domain/inventory.repository';
import type { IInventoryRepository, InventorySummary } from '../../domain/inventory.repository';

@Injectable()
export class GetInventorySummaryUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: IInventoryRepository,
  ) {}

  execute(businessId: number): Promise<InventorySummary> {
    return this.repo.getSummary(businessId);
  }
}
