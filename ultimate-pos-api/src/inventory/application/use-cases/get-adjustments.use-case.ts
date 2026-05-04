import { Inject, Injectable } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../../domain/inventory.repository';
import type { IInventoryRepository, PaginatedEntries } from '../../domain/inventory.repository';

@Injectable()
export class GetAdjustmentsUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: IInventoryRepository,
  ) {}

  execute(businessId: number, page: number, limit: number, productId?: number): Promise<PaginatedEntries> {
    return this.repo.getAdjustments(businessId, page, limit, productId);
  }
}
