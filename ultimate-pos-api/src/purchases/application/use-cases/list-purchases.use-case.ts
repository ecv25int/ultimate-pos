import { Inject, Injectable } from '@nestjs/common';
import type {
  IPurchaseRepository,
  PaginatedPurchases,
  PurchaseFilters,
} from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';

@Injectable()
export class ListPurchasesUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
  ) {}

  async execute(businessId: number, filters: PurchaseFilters): Promise<PaginatedPurchases> {
    return this.repo.findAll(businessId, filters);
  }
}
