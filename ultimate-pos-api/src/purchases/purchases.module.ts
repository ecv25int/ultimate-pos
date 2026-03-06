import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PrismaModule, PushModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
