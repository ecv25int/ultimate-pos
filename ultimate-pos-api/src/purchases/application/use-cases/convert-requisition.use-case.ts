import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Purchase } from '../../domain/purchase.entity';
import type { IPurchaseRepository } from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';

@Injectable()
export class ConvertRequisitionUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
  ) {}

  async execute(id: number, businessId: number): Promise<Purchase> {
    const existing = await this.repo.findById(id, businessId);
    if (!existing) throw new NotFoundException(`Requisition #${id} not found`);
    if (!existing.isRequisition()) {
      throw new NotFoundException(`Requisition #${id} not found`);
    }
    return this.repo.convertToOrder(id, businessId);
  }
}
