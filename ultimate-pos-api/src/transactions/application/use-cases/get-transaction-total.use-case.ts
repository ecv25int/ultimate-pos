import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TransactionType } from '../../domain/transaction-type';
import type { ITransactionRepository } from '../../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/transaction.repository';

@Injectable()
export class GetTransactionTotalUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: ITransactionRepository,
  ) {}

  async execute(
    id: number,
    businessId: number,
    type?: TransactionType,
  ): Promise<{ totalAmount: number }> {
    const transaction = await this.repo.findById(id, businessId, type);
    if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
    return { totalAmount: transaction.totalAmount };
  }
}
