import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SaleReturn } from '../../domain/sale-return.entity';
import type { ISaleReturnRepository } from '../../domain/sale-return.repository';
import { SALE_RETURN_REPOSITORY } from '../../domain/sale-return.repository';

@Injectable()
export class FindSaleReturnUseCase {
  constructor(
    @Inject(SALE_RETURN_REPOSITORY)
    private readonly repo: ISaleReturnRepository,
  ) {}

  async execute(id: number, businessId: number): Promise<SaleReturn> {
    const ret = await this.repo.findById(id, businessId);
    if (!ret) throw new NotFoundException(`Sale return #${id} not found`);
    return ret;
  }
}
