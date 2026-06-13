import { Module } from '@nestjs/common';
import { StockAdjustmentsService } from './stock-adjustments.service';
import { StockAdjustmentsController } from './stock-adjustments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [PrismaModule, InventoryModule, AccountingModule],
  controllers: [StockAdjustmentsController],
  providers: [StockAdjustmentsService],
  exports: [StockAdjustmentsService],
})
export class StockAdjustmentsModule {}
