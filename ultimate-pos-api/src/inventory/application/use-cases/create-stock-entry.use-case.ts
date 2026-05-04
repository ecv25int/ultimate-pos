import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../../domain/inventory.repository';
import type { IInventoryRepository } from '../../domain/inventory.repository';
import type { StockEntry } from '../../domain/stock-entry.entity';
import type { CreateStockEntryDto } from '../../dto/create-stock-entry.dto';

@Injectable()
export class CreateStockEntryUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: IInventoryRepository,
  ) {}

  async execute(businessId: number, userId: number, dto: CreateStockEntryDto): Promise<StockEntry> {
    const product = await this.repo.findProduct(dto.productId, businessId);
    if (!product) throw new NotFoundException(`Product #${dto.productId} not found in your business`);
    if (!product.enableStock) {
      throw new BadRequestException(`Stock tracking is not enabled for product #${dto.productId}`);
    }

    return this.repo.createEntry(businessId, userId, {
      productId: dto.productId,
      entryType: dto.entryType,
      quantity: dto.quantity,
      unitCost: dto.unitCost,
      referenceNo: dto.referenceNo,
      note: dto.note,
    });
  }
}
