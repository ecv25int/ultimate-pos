import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../../domain/inventory.repository';
import type { IInventoryRepository } from '../../domain/inventory.repository';

@Injectable()
export class DeleteStockEntryUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: IInventoryRepository,
  ) {}

  async execute(entryId: number, businessId: number): Promise<void> {
    const entry = await this.repo.findEntry(entryId, businessId);
    if (!entry) throw new NotFoundException(`Stock entry #${entryId} not found`);
    return this.repo.deleteEntry(entryId, businessId);
  }
}
