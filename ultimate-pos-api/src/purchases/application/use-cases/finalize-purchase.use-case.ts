import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Purchase } from '../../domain/purchase.entity';
import type { IPurchaseRepository } from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';

@Injectable()
export class FinalizePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
  ) {}

  async execute(id: number, businessId: number): Promise<Purchase> {
    const existing = await this.repo.findById(id, businessId);
    if (!existing) throw new NotFoundException(`Purchase #${id} not found`);
    if (existing.isFinalized()) {
      throw new BadRequestException(
        `Purchase #${id} is already finalized (status: ${existing.status})`,
      );
    }
    return this.repo.update(id, businessId, { status: 'received' });
  }
}
