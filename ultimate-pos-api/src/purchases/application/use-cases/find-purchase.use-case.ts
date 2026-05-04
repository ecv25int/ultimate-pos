import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Purchase } from '../../domain/purchase.entity';
import type { IPurchaseRepository } from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';

@Injectable()
export class FindPurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
  ) {}

  async execute(id: number, businessId: number): Promise<Purchase> {
    const purchase = await this.repo.findById(id, businessId);
    if (!purchase) throw new NotFoundException(`Purchase #${id} not found`);
    return purchase;
  }
}
