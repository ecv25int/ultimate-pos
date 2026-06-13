import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingController, AccountsController],
  providers: [AccountingService, AccountsService],
  exports: [AccountingService, AccountsService],
})
export class AccountingModule {}
