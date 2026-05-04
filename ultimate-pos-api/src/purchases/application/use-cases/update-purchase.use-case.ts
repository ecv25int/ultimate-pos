import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Purchase } from '../../domain/purchase.entity';
import type { IPurchaseRepository } from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';
import { UpdatePurchaseDto } from '../../dto/update-purchase.dto';

@Injectable()
export class UpdatePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
  ) {}

  async execute(id: number, businessId: number, dto: UpdatePurchaseDto): Promise<Purchase> {
    const existing = await this.repo.findById(id, businessId);
    if (!existing) throw new NotFoundException(`Purchase #${id} not found`);
    if (existing.isFinalized()) {
      throw new BadRequestException(`Purchase #${id} is finalized and cannot be edited`);
    }
    return this.repo.update(id, businessId, dto);
  }
}
