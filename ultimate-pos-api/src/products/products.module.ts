import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PricingService } from './pricing.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, PricingService],
  exports: [ProductsService, PricingService],
})
export class ProductsModule {}
