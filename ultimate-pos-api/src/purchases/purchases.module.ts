import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PURCHASE_REPOSITORY } from './domain/purchase.repository';
import { LandedCostService } from './domain/landed-cost.service';
import { PrismaPurchaseRepository } from './infrastructure/prisma-purchase.repository';
import { CreatePurchaseUseCase } from './application/use-cases/create-purchase.use-case';
import { FindPurchaseUseCase } from './application/use-cases/find-purchase.use-case';
import { ListPurchasesUseCase } from './application/use-cases/list-purchases.use-case';
import { UpdatePurchaseUseCase } from './application/use-cases/update-purchase.use-case';
import { FinalizePurchaseUseCase } from './application/use-cases/finalize-purchase.use-case';
import { CreatePurchaseReturnUseCase } from './application/use-cases/create-purchase-return.use-case';
import { GetPurchasesSummaryUseCase } from './application/use-cases/get-purchases-summary.use-case';
import { ConvertRequisitionUseCase } from './application/use-cases/convert-requisition.use-case';
import { DeletePurchaseUseCase } from './application/use-cases/delete-purchase.use-case';
import { PurchasesController } from './purchases.controller';

const USE_CASES = [
  CreatePurchaseUseCase,
  FindPurchaseUseCase,
  ListPurchasesUseCase,
  UpdatePurchaseUseCase,
  FinalizePurchaseUseCase,
  CreatePurchaseReturnUseCase,
  GetPurchasesSummaryUseCase,
  ConvertRequisitionUseCase,
  DeletePurchaseUseCase,
];

@Module({
  imports: [PrismaModule],
  controllers: [PurchasesController],
  providers: [
    LandedCostService,
    { provide: PURCHASE_REPOSITORY, useClass: PrismaPurchaseRepository },
    ...USE_CASES,
  ],
  exports: USE_CASES,
})
export class PurchasesModule {}
