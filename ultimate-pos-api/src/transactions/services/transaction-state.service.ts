import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionType } from '../dto/create-transaction.dto';

@Injectable()
export class TransactionStateService {
  private readonly transitions: Record<string, string[]> = {
    draft: ['final', 'received', 'completed', 'cancelled'],
    pending: ['final', 'received', 'completed', 'cancelled'],
    ordered: ['received', 'completed', 'cancelled'],
    final: ['cancelled'],
    received: ['cancelled'],
    completed: ['cancelled'],
    cancelled: [],
  };

  canTransition(currentStatus: string, newStatus: string): boolean {
    const current = currentStatus.toLowerCase();
    const next = newStatus.toLowerCase();

    if (current === next) {
      return true;
    }

    return this.transitions[current]?.includes(next) ?? false;
  }

  assertCanTransition(currentStatus: string, newStatus: string): void {
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid transaction status transition: ${currentStatus} -> ${newStatus}`,
      );
    }
  }

  assertCanUpdate(currentStatus: string): void {
    if (this.isLockedStatus(currentStatus)) {
      throw new BadRequestException(
        `Transactions in status '${currentStatus}' cannot be edited`,
      );
    }
  }

  isLockedStatus(status: string): boolean {
    return ['final', 'received', 'completed', 'cancelled'].includes(
      status.toLowerCase(),
    );
  }

  getDraftStatusForType(type: TransactionType): string {
    switch (type) {
      case 'stock_transfer':
        return 'pending';
      default:
        return 'draft';
    }
  }

  getFinalStatusForType(type: TransactionType): string {
    switch (type) {
      case 'purchase':
      case 'stock_adjustment':
        return 'received';
      case 'stock_transfer':
        return 'completed';
      default:
        return 'final';
    }
  }
}