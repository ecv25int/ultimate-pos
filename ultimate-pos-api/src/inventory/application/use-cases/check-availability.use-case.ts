import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../../domain/inventory.repository';
import type { IInventoryRepository } from '../../domain/inventory.repository';
import { StockValidationService } from '../../domain/stock-validation.service';

@Injectable()
export class CheckAvailabilityUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: IInventoryRepository,
    private readonly validator: StockValidationService,
  ) {}

  async execute(productId: number, businessId: number, quantity: number): Promise<boolean> {
    const currentStock = await this.repo.getStockLevel(productId, businessId);
    return this.validator.isAvailable(currentStock, quantity);
  }

  async assertAvailable(productId: number, businessId: number, quantity: number): Promise<void> {
    const currentStock = await this.repo.getStockLevel(productId, businessId);
    if (!this.validator.isAvailable(currentStock, quantity)) {
      throw new BadRequestException(
        `Insufficient stock for product #${productId}: requested ${quantity}, available ${currentStock}`,
      );
    }
  }
}
