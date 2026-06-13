import { Inject, Injectable } from '@nestjs/common';
import type { IPurchaseRepository, PurchaseSummary } from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';

@Injectable()
export class GetPurchasesSummaryUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
  ) {}

  execute(businessId: number): Promise<PurchaseSummary> {
    return this.repo.getSummary(businessId);
  }
}
