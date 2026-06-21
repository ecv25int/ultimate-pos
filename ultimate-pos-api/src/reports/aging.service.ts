import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AgingBucket {
  current: number;
  '30+': number;
  '60+': number;
  '90+': number;
  totalOutstanding: number;
}

export interface ContactAging extends AgingBucket {
  contactId: number;
  contactName: string;
}

export interface AgingReport {
  contacts: ContactAging[];
  summary: AgingBucket;
}

@Injectable()
export class AgingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Accounts Payable (AP) Aging: outstanding vendor purchases */
  async getAPAging(businessId: number, asOfDateInput?: string | Date): Promise<AgingReport> {
    const asOfDate = asOfDateInput ? new Date(asOfDateInput) : new Date();
    if (isNaN(asOfDate.getTime())) {
      throw new Error('Invalid asOfDate value');
    }

    const purchases = await this.prisma.purchase.findMany({
      where: {
        businessId,
        deletedAt: null,
        type: 'purchase',
        purchaseDate: { lte: asOfDate },
      },
      include: {
        contact: {
          select: { id: true, name: true },
        },
        payments: {
          where: {
            paymentDate: { lte: asOfDate },
          },
          select: { amount: true },
        },
      },
    });

    const contactMap = new Map<number, ContactAging>();
    const summary: AgingBucket = {
      current: 0,
      '30+': 0,
      '60+': 0,
      '90+': 0,
      totalOutstanding: 0,
    };

    for (const purchase of purchases) {
      const totalAmount = Number(purchase.totalAmount);
      const paidAmount = purchase.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const outstanding = totalAmount - paidAmount;

      if (outstanding <= 0.005) {
        continue;
      }

      const purchaseDate = new Date(purchase.purchaseDate);
      const diffTime = asOfDate.getTime() - purchaseDate.getTime();
      const ageInDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      let bucket: 'current' | '30+' | '60+' | '90+';
      if (ageInDays <= 30) {
        bucket = 'current';
      } else if (ageInDays <= 60) {
        bucket = '30+';
      } else if (ageInDays <= 90) {
        bucket = '60+';
      } else {
        bucket = '90+';
      }

      const contactId = purchase.contact?.id ?? 0;
      const contactName = purchase.contact?.name ?? 'Unknown / General';

      let contactRecord = contactMap.get(contactId);
      if (!contactRecord) {
        contactRecord = {
          contactId,
          contactName,
          current: 0,
          '30+': 0,
          '60+': 0,
          '90+': 0,
          totalOutstanding: 0,
        };
        contactMap.set(contactId, contactRecord);
      }

      contactRecord[bucket] = Number((contactRecord[bucket] + outstanding).toFixed(4));
      contactRecord.totalOutstanding = Number(
        (contactRecord.totalOutstanding + outstanding).toFixed(4),
      );

      summary[bucket] = Number((summary[bucket] + outstanding).toFixed(4));
      summary.totalOutstanding = Number((summary.totalOutstanding + outstanding).toFixed(4));
    }

    // Convert values back to clean 2 decimal places for response, sort by total outstanding desc
    const contacts = Array.from(contactMap.values())
      .map((c) => ({
        ...c,
        current: Number(c.current.toFixed(2)),
        '30+': Number(c['30+'].toFixed(2)),
        '60+': Number(c['60+'].toFixed(2)),
        '90+': Number(c['90+'].toFixed(2)),
        totalOutstanding: Number(c.totalOutstanding.toFixed(2)),
      }))
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    return {
      contacts,
      summary: {
        current: Number(summary.current.toFixed(2)),
        '30+': Number(summary['30+'].toFixed(2)),
        '60+': Number(summary['60+'].toFixed(2)),
        '90+': Number(summary['90+'].toFixed(2)),
        totalOutstanding: Number(summary.totalOutstanding.toFixed(2)),
      },
    };
  }

  /** Accounts Receivable (AR) Aging: outstanding customer sales */
  async getARAging(businessId: number, asOfDateInput?: string | Date): Promise<AgingReport> {
    const asOfDate = asOfDateInput ? new Date(asOfDateInput) : new Date();
    if (isNaN(asOfDate.getTime())) {
      throw new Error('Invalid asOfDate value');
    }

    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        deletedAt: null,
        type: 'sale',
        transactionDate: { lte: asOfDate },
      },
      include: {
        contact: {
          select: { id: true, name: true },
        },
        payments: {
          where: {
            paymentDate: { lte: asOfDate },
          },
          select: { amount: true },
        },
      },
    });

    const contactMap = new Map<number, ContactAging>();
    const summary: AgingBucket = {
      current: 0,
      '30+': 0,
      '60+': 0,
      '90+': 0,
      totalOutstanding: 0,
    };

    for (const sale of sales) {
      const totalAmount = Number(sale.totalAmount);
      const paidAmount = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const outstanding = totalAmount - paidAmount;

      if (outstanding <= 0.005) {
        continue;
      }

      const transactionDate = new Date(sale.transactionDate);
      const diffTime = asOfDate.getTime() - transactionDate.getTime();
      const ageInDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      let bucket: 'current' | '30+' | '60+' | '90+';
      if (ageInDays <= 30) {
        bucket = 'current';
      } else if (ageInDays <= 60) {
        bucket = '30+';
      } else if (ageInDays <= 90) {
        bucket = '60+';
      } else {
        bucket = '90+';
      }

      const contactId = sale.contact?.id ?? 0;
      const contactName = sale.contact?.name ?? 'Walk-in Customer';

      let contactRecord = contactMap.get(contactId);
      if (!contactRecord) {
        contactRecord = {
          contactId,
          contactName,
          current: 0,
          '30+': 0,
          '60+': 0,
          '90+': 0,
          totalOutstanding: 0,
        };
        contactMap.set(contactId, contactRecord);
      }

      contactRecord[bucket] = Number((contactRecord[bucket] + outstanding).toFixed(4));
      contactRecord.totalOutstanding = Number(
        (contactRecord.totalOutstanding + outstanding).toFixed(4),
      );

      summary[bucket] = Number((summary[bucket] + outstanding).toFixed(4));
      summary.totalOutstanding = Number((summary.totalOutstanding + outstanding).toFixed(4));
    }

    // Convert values back to clean 2 decimal places for response, sort by total outstanding desc
    const contacts = Array.from(contactMap.values())
      .map((c) => ({
        ...c,
        current: Number(c.current.toFixed(2)),
        '30+': Number(c['30+'].toFixed(2)),
        '60+': Number(c['60+'].toFixed(2)),
        '90+': Number(c['90+'].toFixed(2)),
        totalOutstanding: Number(c.totalOutstanding.toFixed(2)),
      }))
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    return {
      contacts,
      summary: {
        current: Number(summary.current.toFixed(2)),
        '30+': Number(summary['30+'].toFixed(2)),
        '60+': Number(summary['60+'].toFixed(2)),
        '90+': Number(summary['90+'].toFixed(2)),
        totalOutstanding: Number(summary.totalOutstanding.toFixed(2)),
      },
    };
  }
}
