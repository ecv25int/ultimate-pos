import { Inject, Injectable } from '@nestjs/common';
import type {
  ITransactionRepository,
  PaginatedTransactions,
  TransactionFilters,
} from '../../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/transaction.repository';

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: ITransactionRepository,
  ) {}

  async execute(
    businessId: number,
    filters: TransactionFilters,
  ): Promise<PaginatedTransactions> {
    return this.repo.findAll(businessId, filters);
  }
}
