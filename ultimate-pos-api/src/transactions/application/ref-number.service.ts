import { Inject, Injectable } from '@nestjs/common';
import type { TransactionType } from '../domain/transaction-type';
import type { ITransactionRepository } from '../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../domain/transaction.repository';

@Injectable()
export class RefNumberService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: ITransactionRepository,
  ) {}

  async getNextRefNo(type: TransactionType, businessId: number): Promise<string> {
    const prefix = `${type.toUpperCase()}-${this.period()}-`;
    const refs = await this.repo.findRefNos(type, businessId, prefix);
    const next =
      refs.map((ref) => this.extractSeq(ref, prefix)).reduce((max, n) => Math.max(max, n), 0) + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  private period(date = new Date()): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private extractSeq(refNo: string | null, prefix: string): number {
    if (!refNo?.startsWith(prefix)) return 0;
    const n = parseInt(refNo.slice(prefix.length), 10);
    return isNaN(n) ? 0 : n;
  }
}
