import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { INVENTORY_REPOSITORY } from './domain/inventory.repository';
import { StockValidationService } from './domain/stock-validation.service';
import { PrismaInventoryRepository } from './infrastructure/prisma-inventory.repository';
import { CheckAvailabilityUseCase } from './application/use-cases/check-availability.use-case';
import { GetStockLevelUseCase } from './application/use-cases/get-stock-level.use-case';
import { GetStockOverviewUseCase } from './application/use-cases/get-stock-overview.use-case';
import { GetLowStockUseCase } from './application/use-cases/get-low-stock.use-case';
import { GetProductHistoryUseCase } from './application/use-cases/get-product-history.use-case';
import { GetInventorySummaryUseCase } from './application/use-cases/get-inventory-summary.use-case';
import { GetAdjustmentsUseCase } from './application/use-cases/get-adjustments.use-case';
import { CreateStockEntryUseCase } from './application/use-cases/create-stock-entry.use-case';
import { DeleteStockEntryUseCase } from './application/use-cases/delete-stock-entry.use-case';
import { InventoryController } from './inventory.controller';
import { StockService } from './stock.service';
import { BatchService } from './batch.service';

const USE_CASES = [
  CheckAvailabilityUseCase,
  GetStockLevelUseCase,
  GetStockOverviewUseCase,
  GetLowStockUseCase,
  GetProductHistoryUseCase,
  GetInventorySummaryUseCase,
  GetAdjustmentsUseCase,
  CreateStockEntryUseCase,
  DeleteStockEntryUseCase,
];

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [InventoryController],
  providers: [
    StockValidationService,
    { provide: INVENTORY_REPOSITORY, useClass: PrismaInventoryRepository },
    StockService,
    BatchService,
    ...USE_CASES,
  ],
  exports: [CheckAvailabilityUseCase, StockService, BatchService, ...USE_CASES],
})
export class InventoryModule {}
