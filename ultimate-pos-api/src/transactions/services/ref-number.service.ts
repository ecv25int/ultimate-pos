import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '../dto/create-transaction.dto';

@Injectable()
export class RefNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextRefNo(type: TransactionType, businessId: number): Promise<string> {
    const period = this.getPeriod();
    const prefix = `${this.getPrefix(type)}-${period}-`;
    const refs = await this.findExistingRefs(type, businessId, prefix);
    const nextSequence = refs
      .map((ref) => this.extractSequence(ref, prefix))
      .reduce((max, current) => Math.max(max, current), 0) + 1;

    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }

  private getPeriod(date = new Date()): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private getPrefix(type: TransactionType): string {
    return type.toUpperCase();
  }

  private extractSequence(refNo: string | null, prefix: string): number {
    if (!refNo || !refNo.startsWith(prefix)) {
      return 0;
    }

    const suffix = refNo.slice(prefix.length);
    const parsed = Number.parseInt(suffix, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private async findExistingRefs(
    type: TransactionType,
    businessId: number,
    prefix: string,
  ): Promise<Array<string | null>> {
    switch (type) {
      case 'sale': {
        const sales = await this.prisma.sale.findMany({
          where: { businessId, invoiceNo: { startsWith: prefix } },
          select: { invoiceNo: true },
        });
        return sales.map((sale) => sale.invoiceNo);
      }
      case 'purchase': {
        const purchases = await this.prisma.purchase.findMany({
          where: { businessId, refNo: { startsWith: prefix } },
          select: { refNo: true },
        });
        return purchases.map((purchase) => purchase.refNo);
      }
      case 'expense': {
        const expenses = await this.prisma.expense.findMany({
          where: { businessId, refNo: { startsWith: prefix } },
          select: { refNo: true },
        });
        return expenses.map((expense) => expense.refNo);
      }
      case 'stock_transfer': {
        const transfers = await this.prisma.stockTransfer.findMany({
          where: { businessId, referenceNo: { startsWith: prefix } },
          select: { referenceNo: true },
        });
        return transfers.map((transfer) => transfer.referenceNo);
      }
      case 'stock_adjustment': {
        const adjustments = await this.prisma.stockAdjustment.findMany({
          where: { businessId, referenceNo: { startsWith: prefix } },
          select: { referenceNo: true },
        });
        return adjustments.map((adjustment) => adjustment.referenceNo);
      }
    }
  }
}