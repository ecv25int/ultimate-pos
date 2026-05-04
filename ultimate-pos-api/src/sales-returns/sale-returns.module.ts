import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateSaleReturnUseCase } from './application/use-cases/create-sale-return.use-case';
import { FindSaleReturnUseCase } from './application/use-cases/find-sale-return.use-case';
import { ListSaleReturnsUseCase } from './application/use-cases/list-sale-returns.use-case';
import { SaleReturnValidatorService } from './domain/sale-return-validator.service';
import { SALE_RETURN_REPOSITORY } from './domain/sale-return.repository';
import { PrismaSaleReturnRepository } from './infrastructure/prisma-sale-return.repository';
import { SaleReturnsController } from './sale-returns.controller';

const USE_CASES = [CreateSaleReturnUseCase, FindSaleReturnUseCase, ListSaleReturnsUseCase];

@Module({
  imports: [PrismaModule],
  controllers: [SaleReturnsController],
  providers: [
    SaleReturnValidatorService,
    { provide: SALE_RETURN_REPOSITORY, useClass: PrismaSaleReturnRepository },
    ...USE_CASES,
  ],
  exports: [...USE_CASES, SaleReturnValidatorService],
})
export class SaleReturnsModule {}
