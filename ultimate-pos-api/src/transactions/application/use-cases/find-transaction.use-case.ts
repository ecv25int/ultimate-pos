import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TransactionType } from '../../domain/transaction-type';
import type { Transaction } from '../../domain/transaction.entity';
import type { ITransactionRepository } from '../../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/transaction.repository';

@Injectable()
export class FindTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: ITransactionRepository,
  ) {}

  async execute(id: number, businessId: number, type?: TransactionType): Promise<Transaction> {
    const transaction = await this.repo.findById(id, businessId, type);
    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }
    return transaction;
  }
}
