import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  getExchangeRate(fromCurrency: string, toCurrency: string, asOfDate?: string | Date): number {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    if (from === to) return 1.0;

    const date = asOfDate ? new Date(asOfDate) : new Date();
    const day = date.getUTCDate(); // 1 to 31

    // Baseline conversion rates to USD
    let eurToUsd = 1.1;
    let gbpToUsd = 1.3;

    // Deterministic daily fluctuations for testing
    eurToUsd += (day - 15) * 0.005; // -0.07 to +0.08
    gbpToUsd += (day - 15) * 0.006; // -0.084 to +0.096

    const ratesToUsd: Record<string, number> = {
      USD: 1.0,
      EUR: eurToUsd,
      GBP: gbpToUsd,
      CAD: 0.74 + (day - 15) * 0.002,
      JPY: 0.0067 + (day - 15) * 0.00005,
    };

    const fromRate = ratesToUsd[from];
    const toRate = ratesToUsd[to];

    if (!fromRate || !toRate) {
      if (from === 'EUR' && to === 'USD') return 1.1;
      if (from === 'USD' && to === 'EUR') return 1 / 1.1;
      if (from === 'GBP' && to === 'USD') return 1.3;
      if (from === 'USD' && to === 'GBP') return 1 / 1.3;
      return 1.0;
    }

    return fromRate / toRate;
  }

  convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rate?: number,
    asOfDate?: string | Date,
  ): number {
    const conversionRate = rate ?? this.getExchangeRate(fromCurrency, toCurrency, asOfDate);
    const converted = amount * conversionRate;
    return Math.round(converted * 10000) / 10000;
  }

  buildTransactionNote(
    description: string,
    foreignCurrency?: string,
    foreignAmount?: number,
    exchangeRate?: number,
  ): string {
    if (foreignCurrency && foreignAmount !== undefined && exchangeRate !== undefined) {
      return JSON.stringify({
        foreignCurrency,
        foreignAmount,
        exchangeRate,
        description,
      });
    }
    return description;
  }

  parseTransactionNote(note?: string | null): {
    description: string;
    foreignCurrency?: string;
    foreignAmount?: number;
    exchangeRate?: number;
  } {
    if (!note) {
      return { description: '' };
    }
    try {
      const parsed = JSON.parse(note) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && 'foreignCurrency' in parsed) {
        return parsed as {
          description: string;
          foreignCurrency: string;
          foreignAmount: number;
          exchangeRate: number;
        };
      }
    } catch {
      // Plain text description
    }
    return { description: note };
  }

  async getAccountMultiCurrencyBalance(accountId: number, asOfDate?: string | Date) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { accountType: { select: { rootType: true } } },
    });
    if (!account) {
      throw new NotFoundException(`Account #${accountId} not found`);
    }

    const details = account.accountDetails
      ? (JSON.parse(account.accountDetails) as Record<string, unknown>)
      : {};
    const foreignCurrency = typeof details.currency === 'string' ? details.currency : null;

    const txs = await this.prisma.accountTransaction.findMany({
      where: {
        accountId,
        operationDate: asOfDate ? { lte: new Date(asOfDate) } : undefined,
      },
    });

    let baseDebit = 0;
    let baseCredit = 0;
    let foreignDebit = 0;
    let foreignCredit = 0;

    for (const tx of txs) {
      const amt = Number(tx.amount);
      const isDebit = tx.type === 'debit';

      if (isDebit) {
        baseDebit += amt;
      } else {
        baseCredit += amt;
      }

      if (foreignCurrency) {
        const parsed = this.parseTransactionNote(tx.note);
        let fAmt = parsed.foreignAmount ?? 0;
        if (!parsed.foreignCurrency && amt > 0) {
          const rate = this.getExchangeRate(foreignCurrency, 'USD', tx.operationDate);
          fAmt = amt / rate;
        }
        if (isDebit) {
          foreignDebit += fAmt;
        } else {
          foreignCredit += fAmt;
        }
      }
    }

    const rt = account.accountType.rootType.toLowerCase();
    const isNormalDebit = rt === 'asset' || rt === 'expense';

    const baseBalance =
      Math.round((isNormalDebit ? baseDebit - baseCredit : baseCredit - baseDebit) * 10000) / 10000;
    const foreignBalance = foreignCurrency
      ? Math.round(
          (isNormalDebit ? foreignDebit - foreignCredit : foreignCredit - foreignDebit) * 10000,
        ) / 10000
      : null;

    return {
      accountId: account.id,
      accountName: account.name,
      accountNumber: account.accountNumber,
      rootType: rt,
      foreignCurrency,
      baseBalance,
      foreignBalance,
    };
  }

  async calculateUnrealizedGains(businessId: number, asOfDate?: string | Date) {
    const accounts = await this.prisma.account.findMany({
      where: { businessId },
      include: { accountType: { select: { rootType: true } } },
    });

    const report = [];

    for (const account of accounts) {
      const details = account.accountDetails
        ? (JSON.parse(account.accountDetails) as Record<string, unknown>)
        : {};
      const foreignCurrency = typeof details.currency === 'string' ? details.currency : null;

      if (foreignCurrency && foreignCurrency.toUpperCase() !== 'USD') {
        const bal = await this.getAccountMultiCurrencyBalance(account.id, asOfDate);
        const currentRate = this.getExchangeRate(foreignCurrency, 'USD', asOfDate);

        const currentValue = Math.round((bal.foreignBalance ?? 0) * currentRate * 10000) / 10000;
        const historicalValue = bal.baseBalance;

        const isNormalDebit = bal.rootType === 'asset' || bal.rootType === 'expense';
        const unrealizedGain =
          Math.round(
            (isNormalDebit ? currentValue - historicalValue : historicalValue - currentValue) *
              10000,
          ) / 10000;

        report.push({
          accountId: account.id,
          accountNumber: account.accountNumber,
          accountName: account.name,
          rootType: bal.rootType,
          foreignCurrency,
          foreignBalance: bal.foreignBalance,
          historicalValue,
          currentRate,
          currentValue,
          unrealizedGain,
        });
      }
    }

    const totalUnrealizedGain =
      Math.round(report.reduce((sum, item) => sum + item.unrealizedGain, 0) * 10000) / 10000;

    return {
      asOfDate: asOfDate ? new Date(asOfDate) : new Date(),
      accounts: report,
      totalUnrealizedGain,
    };
  }
}
