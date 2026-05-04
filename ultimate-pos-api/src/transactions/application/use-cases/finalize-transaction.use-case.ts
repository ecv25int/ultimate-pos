import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionStateService } from '../../domain/transaction-state.service';
import type { TransactionType } from '../../domain/transaction-type';
import type { Transaction } from '../../domain/transaction.entity';
import type { ITransactionRepository } from '../../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/transaction.repository';

@Injectable()
export class FinalizeTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: ITransactionRepository,
    private readonly stateService: TransactionStateService,
  ) {}

  async execute(
    id: number,
    businessId: number,
    type?: TransactionType,
  ): Promise<Transaction> {
    const resolvedType = type ?? (await this.resolveType(id, businessId));
    const existing = await this.repo.findById(id, businessId, resolvedType);
    if (!existing) throw new NotFoundException(`Transaction #${id} not found`);

    const finalStatus = this.stateService.finalStatusForType(resolvedType);
    this.stateService.assertCanTransition(existing.status, finalStatus);

    return this.repo.updateStatus(id, businessId, finalStatus, resolvedType);
  }

  private async resolveType(id: number, businessId: number): Promise<TransactionType> {
    const type = await this.repo.inferType(id, businessId);
    if (!type) throw new NotFoundException(`Transaction #${id} not found`);
    return type;
  }
}
