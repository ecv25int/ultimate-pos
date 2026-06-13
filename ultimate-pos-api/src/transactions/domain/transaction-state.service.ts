import { TransactionType } from './transaction-type';

const TRANSITIONS: Record<string, string[]> = {
  draft: ['final', 'received', 'completed', 'cancelled'],
  pending: ['final', 'received', 'completed', 'cancelled'],
  ordered: ['received', 'completed', 'cancelled'],
  final: ['cancelled'],
  received: ['cancelled'],
  completed: ['cancelled'],
  cancelled: [],
};

const LOCKED_STATUSES = new Set(['final', 'received', 'completed', 'cancelled']);

export class TransactionStateService {
  canTransition(currentStatus: string, newStatus: string): boolean {
    const current = currentStatus.toLowerCase();
    const next = newStatus.toLowerCase();
    if (current === next) return true;
    return TRANSITIONS[current]?.includes(next) ?? false;
  }

  assertCanTransition(currentStatus: string, newStatus: string): void {
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`);
    }
  }

  isLocked(status: string): boolean {
    return LOCKED_STATUSES.has(status.toLowerCase());
  }

  assertCanUpdate(status: string): void {
    if (this.isLocked(status)) {
      throw new Error(`Transactions with status '${status}' cannot be edited`);
    }
  }

  initialStatusForType(type: TransactionType): string {
    return type === 'stock_transfer' ? 'pending' : 'draft';
  }

  finalStatusForType(type: TransactionType): string {
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
