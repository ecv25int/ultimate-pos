import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { CashDrawerService } from './cash-drawer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [PrismaModule, SalesModule],
  controllers: [PosController],
  providers: [PosService, CashDrawerService],
})
export class PosModule {}
