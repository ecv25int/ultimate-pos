export class PaymentStatusService {
  calculate(totalPaid: number, totalAmount: number): 'paid' | 'partial' | 'due' {
    if (totalPaid >= totalAmount) return 'paid';
    if (totalPaid > 0) return 'partial';
    return 'due';
  }

  getBalance(totalAmount: number, totalPaid: number): number {
    return Math.max(totalAmount - totalPaid, 0);
  }

  wouldOverpay(currentPaid: number, newAmount: number, totalAmount: number): boolean {
    return currentPaid + newAmount > totalAmount + 0.0001; // float tolerance
  }
}
