import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { PostingService } from './posting.service';
import { CurrencyService } from './currency.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingController, AccountsController, JournalController],
  providers: [AccountingService, AccountsService, JournalService, PostingService, CurrencyService],
  exports: [AccountingService, AccountsService, JournalService, PostingService, CurrencyService],
})
export class AccountingModule {}
