import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { RefNumberService } from './services/ref-number.service';
import { TransactionStateService } from './services/transaction-state.service';

@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, RefNumberService, TransactionStateService],
  exports: [TransactionsService],
})
export class TransactionsModule {}