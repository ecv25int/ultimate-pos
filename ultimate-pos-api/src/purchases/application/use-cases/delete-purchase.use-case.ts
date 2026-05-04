import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPurchaseRepository } from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';

@Injectable()
export class DeletePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
  ) {}

  async execute(id: number, businessId: number): Promise<void> {
    const existing = await this.repo.findById(id, businessId);
    if (!existing) throw new NotFoundException(`Purchase #${id} not found`);
    if (existing.isFinalized()) {
      throw new BadRequestException(`Purchase #${id} is finalized and cannot be deleted`);
    }
    return this.repo.remove(id, businessId);
  }
}
