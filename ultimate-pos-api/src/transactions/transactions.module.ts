import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RefNumberService } from './application/ref-number.service';
import { CancelTransactionUseCase } from './application/use-cases/cancel-transaction.use-case';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { FinalizeTransactionUseCase } from './application/use-cases/finalize-transaction.use-case';
import { FindTransactionUseCase } from './application/use-cases/find-transaction.use-case';
import { GetTransactionTotalUseCase } from './application/use-cases/get-transaction-total.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { UpdateTransactionUseCase } from './application/use-cases/update-transaction.use-case';
import { TransactionStateService } from './domain/transaction-state.service';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository';
import { PrismaTransactionRepository } from './infrastructure/prisma-transaction.repository';
import { TransactionsController } from './transactions.controller';

const USE_CASES = [
  CreateTransactionUseCase,
  FindTransactionUseCase,
  ListTransactionsUseCase,
  UpdateTransactionUseCase,
  FinalizeTransactionUseCase,
  CancelTransactionUseCase,
  GetTransactionTotalUseCase,
];

@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
  providers: [
    TransactionStateService,
    RefNumberService,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    ...USE_CASES,
  ],
  exports: [TransactionStateService, ...USE_CASES],
})
export class TransactionsModule {}
