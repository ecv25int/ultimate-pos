import { Module } from '@nestjs/common';
import { TaxRatesController } from './tax-rates.controller';
import { TaxRatesService } from './tax-rates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaxRatesController],
  providers: [TaxRatesService],
  exports: [TaxRatesService],
})
export class TaxRatesModule {}
