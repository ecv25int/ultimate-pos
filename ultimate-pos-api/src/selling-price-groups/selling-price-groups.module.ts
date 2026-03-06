import { Module } from '@nestjs/common';
import { SellingPriceGroupsService } from './selling-price-groups.service';
import { SellingPriceGroupsController } from './selling-price-groups.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SellingPriceGroupsController],
  providers: [SellingPriceGroupsService],
  exports: [SellingPriceGroupsService],
})
export class SellingPriceGroupsModule {}
