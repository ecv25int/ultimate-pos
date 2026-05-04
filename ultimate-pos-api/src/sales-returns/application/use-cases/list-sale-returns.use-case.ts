import { Inject, Injectable } from '@nestjs/common';
import type { SaleReturn } from '../../domain/sale-return.entity';
import type { ISaleReturnRepository } from '../../domain/sale-return.repository';
import { SALE_RETURN_REPOSITORY } from '../../domain/sale-return.repository';

@Injectable()
export class ListSaleReturnsUseCase {
  constructor(
    @Inject(SALE_RETURN_REPOSITORY)
    private readonly repo: ISaleReturnRepository,
  ) {}

  async execute(saleId: number, businessId: number): Promise<SaleReturn[]> {
    return this.repo.findBySaleId(saleId, businessId);
  }
}
