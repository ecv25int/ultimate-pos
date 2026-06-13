import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CurrencyService } from './currency.service';

@Injectable()
export class PostingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currencyService: CurrencyService,
  ) {}

  private async getRequiredAccount(businessId: number, accountNumber: string, defaultName: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        businessId,
        OR: [{ accountNumber }, { name: defaultName }],
      },
    });

    if (!account) {
      throw new BadRequestException(
        `Required accounting mapping is missing: '${defaultName}' (Account Number: ${accountNumber}). Please seed standard accounts.`,
      );
    }

    if (account.isClosed) {
      throw new BadRequestException(
        `Required accounting mapping '${defaultName}' (Account Number: ${accountNumber}) is closed. Cannot post transaction.`,
      );
    }

    return account;
  }

  async postSaleToGL(businessId: number, saleId: number) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, businessId },
    });

    if (!sale) {
      throw new NotFoundException(`Sale #${saleId} not found`);
    }

    // Only post finalized sales
    if (sale.status !== 'final') {
      return;
    }

    const totalAmount = new Decimal(sale.totalAmount);
    const taxAmount = new Decimal(sale.taxAmount ?? 0);
    const netAmount = totalAmount.minus(taxAmount);

    const arAcc = await this.getRequiredAccount(businessId, '1200', 'Accounts Receivable');
    const revAcc = await this.getRequiredAccount(businessId, '4010', 'Sales Revenue');
    const taxAcc = taxAmount.greaterThan(0)
      ? await this.getRequiredAccount(businessId, '2200', 'Sales Tax Payable')
      : null;

    await this.prisma.$transaction(async (tx) => {
      // Idempotency: delete existing GL transactions for this sale first
      await tx.accountTransaction.deleteMany({
        where: {
          subType: 'sale',
          linkedTransactionId: saleId,
        },
      });

      // 1. Debit Accounts Receivable
      await tx.accountTransaction.create({
        data: {
          accountId: arAcc.id,
          type: 'debit',
          subType: 'sale',
          amount: totalAmount,
          referenceNo: sale.invoiceNo,
          operationDate: sale.transactionDate,
          note: `GL post for Sale #${sale.invoiceNo}`,
          linkedTransactionId: sale.id,
          createdBy: sale.createdBy,
        },
      });

      // 2. Credit Sales Revenue
      await tx.accountTransaction.create({
        data: {
          accountId: revAcc.id,
          type: 'credit',
          subType: 'sale',
          amount: netAmount,
          referenceNo: sale.invoiceNo,
          operationDate: sale.transactionDate,
          note: `GL post for Sale #${sale.invoiceNo}`,
          linkedTransactionId: sale.id,
          createdBy: sale.createdBy,
        },
      });

      // 3. Credit Sales Tax Payable
      if (taxAcc && taxAmount.greaterThan(0)) {
        await tx.accountTransaction.create({
          data: {
            accountId: taxAcc.id,
            type: 'credit',
            subType: 'sale',
            amount: taxAmount,
            referenceNo: sale.invoiceNo,
            operationDate: sale.transactionDate,
            note: `GL post for Sale Tax #${sale.invoiceNo}`,
            linkedTransactionId: sale.id,
            createdBy: sale.createdBy,
          },
        });
      }
    });
  }

  async postPurchaseToGL(businessId: number, purchaseId: number) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, businessId },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase #${purchaseId} not found`);
    }

    // Only post received purchases
    if (purchase.status !== 'received') {
      return;
    }

    const totalAmount = new Decimal(purchase.totalAmount);
    const taxAmount = new Decimal(purchase.taxAmount ?? 0);
    const netAmount = totalAmount.minus(taxAmount);

    const apAcc = await this.getRequiredAccount(businessId, '2010', 'Accounts Payable');
    const cogsAcc = await this.getRequiredAccount(businessId, '5010', 'Cost of Goods Sold');
    const taxAcc = taxAmount.greaterThan(0)
      ? await this.getRequiredAccount(businessId, '2200', 'Sales Tax Payable')
      : null;

    await this.prisma.$transaction(async (tx) => {
      // Idempotency: delete existing GL transactions for this purchase first
      await tx.accountTransaction.deleteMany({
        where: {
          subType: 'purchase',
          linkedTransactionId: purchaseId,
        },
      });

      // 1. Credit Accounts Payable
      await tx.accountTransaction.create({
        data: {
          accountId: apAcc.id,
          type: 'credit',
          subType: 'purchase',
          amount: totalAmount,
          referenceNo: purchase.refNo,
          operationDate: purchase.purchaseDate,
          note: `GL post for Purchase #${purchase.refNo}`,
          linkedTransactionId: purchase.id,
          createdBy: purchase.createdBy,
        },
      });

      // 2. Debit Cost of Goods Sold
      await tx.accountTransaction.create({
        data: {
          accountId: cogsAcc.id,
          type: 'debit',
          subType: 'purchase',
          amount: netAmount,
          referenceNo: purchase.refNo,
          operationDate: purchase.purchaseDate,
          note: `GL post for Purchase #${purchase.refNo}`,
          linkedTransactionId: purchase.id,
          createdBy: purchase.createdBy,
        },
      });

      // 3. Debit Sales Tax Payable (as input tax offset)
      if (taxAcc && taxAmount.greaterThan(0)) {
        await tx.accountTransaction.create({
          data: {
            accountId: taxAcc.id,
            type: 'debit',
            subType: 'purchase',
            amount: taxAmount,
            referenceNo: purchase.refNo,
            operationDate: purchase.purchaseDate,
            note: `GL post for Purchase Tax #${purchase.refNo}`,
            linkedTransactionId: purchase.id,
            createdBy: purchase.createdBy,
          },
        });
      }
    });
  }

  async postPaymentToGL(businessId: number, paymentId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, businessId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment #${paymentId} not found`);
    }

    const isCash = payment.method === 'cash';
    const bankOrCashAcc = isCash
      ? await this.getRequiredAccount(businessId, '1010', 'Cash')
      : await this.getRequiredAccount(businessId, '1020', 'Bank Account');

    // Multi-currency calculation
    let baseAmount = Number(payment.amount);
    const defaultNote = payment.saleId
      ? `GL post for Sale Payment #${payment.id}`
      : payment.purchaseId
        ? `GL post for Purchase Payment #${payment.id}`
        : `GL post for Payment #${payment.id}`;

    let noteText = payment.note ? `GL post: ${payment.note}` : defaultNote;

    const accDetails = bankOrCashAcc.accountDetails
      ? (JSON.parse(bankOrCashAcc.accountDetails) as Record<string, unknown>)
      : {};
    const accCurrency = typeof accDetails.currency === 'string' ? accDetails.currency : undefined;

    if (accCurrency && accCurrency.toUpperCase() !== 'USD') {
      const rate = this.currencyService.getExchangeRate(accCurrency, 'USD', payment.paymentDate);
      baseAmount = Number(payment.amount) * rate;
      // Round to 4 decimal places to avoid floating point issues (e.g. 110.00000000000001)
      baseAmount = Math.round(baseAmount * 10000) / 10000;
      noteText = this.currencyService.buildTransactionNote(
        payment.note ?? `Payment #${payment.id} in ${accCurrency}`,
        accCurrency,
        Number(payment.amount),
        rate,
      );
    }

    const decimalAmount = new Decimal(baseAmount);

    await this.prisma.$transaction(async (tx) => {
      // Idempotency: delete existing GL transactions for this payment first
      await tx.accountTransaction.deleteMany({
        where: {
          subType: 'payment',
          linkedTransactionId: paymentId,
        },
      });

      if (payment.saleId) {
        const arAcc = await this.getRequiredAccount(businessId, '1200', 'Accounts Receivable');
        // Debit Cash/Bank, Credit Accounts Receivable
        await tx.accountTransaction.create({
          data: {
            accountId: bankOrCashAcc.id,
            type: 'debit',
            subType: 'payment',
            amount: decimalAmount,
            referenceNo: payment.referenceNo ?? `PAY-SALE-${payment.id}`,
            operationDate: payment.paymentDate,
            note: noteText,
            linkedTransactionId: payment.id,
            createdBy: payment.createdBy,
          },
        });

        await tx.accountTransaction.create({
          data: {
            accountId: arAcc.id,
            type: 'credit',
            subType: 'payment',
            amount: decimalAmount,
            referenceNo: payment.referenceNo ?? `PAY-SALE-${payment.id}`,
            operationDate: payment.paymentDate,
            note: payment.note
              ? `GL post: ${payment.note}`
              : `GL post for Sale Payment #${payment.id}`,
            linkedTransactionId: payment.id,
            createdBy: payment.createdBy,
          },
        });
      } else if (payment.purchaseId) {
        const apAcc = await this.getRequiredAccount(businessId, '2010', 'Accounts Payable');
        // Debit Accounts Payable, Credit Cash/Bank
        await tx.accountTransaction.create({
          data: {
            accountId: apAcc.id,
            type: 'debit',
            subType: 'payment',
            amount: decimalAmount,
            referenceNo: payment.referenceNo ?? `PAY-PURCH-${payment.id}`,
            operationDate: payment.paymentDate,
            note: payment.note
              ? `GL post: ${payment.note}`
              : `GL post for Purchase Payment #${payment.id}`,
            linkedTransactionId: payment.id,
            createdBy: payment.createdBy,
          },
        });

        await tx.accountTransaction.create({
          data: {
            accountId: bankOrCashAcc.id,
            type: 'credit',
            subType: 'payment',
            amount: decimalAmount,
            referenceNo: payment.referenceNo ?? `PAY-PURCH-${payment.id}`,
            operationDate: payment.paymentDate,
            note: noteText,
            linkedTransactionId: payment.id,
            createdBy: payment.createdBy,
          },
        });
      }
    });
  }

  async postStockAdjustmentToGL(businessId: number, adjustmentId: number) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id: adjustmentId, businessId },
      include: { lines: true },
    });

    if (!adjustment) {
      throw new NotFoundException(`Stock Adjustment #${adjustmentId} not found`);
    }

    // Only post finalized/received adjustments
    if (adjustment.status !== 'received') {
      return;
    }

    let netValue = new Decimal(0);
    for (const line of adjustment.lines) {
      const lineValue = new Decimal(line.quantity).mul(new Decimal(line.unitPrice ?? 0));
      netValue = netValue.plus(lineValue);
    }

    if (netValue.isZero()) {
      return;
    }

    const inventoryAcc = await this.getRequiredAccount(businessId, '1300', 'Inventory');
    const cogsAcc = await this.getRequiredAccount(businessId, '5010', 'Cost of Goods Sold');

    await this.prisma.$transaction(async (tx) => {
      // Idempotency: delete existing GL transactions for this stock adjustment first
      await tx.accountTransaction.deleteMany({
        where: {
          subType: 'stock_adjustment',
          linkedTransactionId: adjustmentId,
        },
      });

      if (netValue.greaterThan(0)) {
        // Debit Inventory, Credit Cost of Goods Sold (Stock Gain)
        await tx.accountTransaction.create({
          data: {
            accountId: inventoryAcc.id,
            type: 'debit',
            subType: 'stock_adjustment',
            amount: netValue,
            referenceNo: adjustment.referenceNo ?? `ADJ-${adjustment.id}`,
            operationDate: adjustment.finalisedAt ?? new Date(),
            note: `GL post for Stock Adjustment #${adjustment.id} (Stock Gain)`,
            linkedTransactionId: adjustment.id,
            createdBy: adjustment.createdBy,
          },
        });

        await tx.accountTransaction.create({
          data: {
            accountId: cogsAcc.id,
            type: 'credit',
            subType: 'stock_adjustment',
            amount: netValue,
            referenceNo: adjustment.referenceNo ?? `ADJ-${adjustment.id}`,
            operationDate: adjustment.finalisedAt ?? new Date(),
            note: `GL post for Stock Adjustment #${adjustment.id} (Stock Gain)`,
            linkedTransactionId: adjustment.id,
            createdBy: adjustment.createdBy,
          },
        });
      } else {
        const absValue = netValue.abs();
        // Debit Cost of Goods Sold, Credit Inventory (Stock Loss)
        await tx.accountTransaction.create({
          data: {
            accountId: cogsAcc.id,
            type: 'debit',
            subType: 'stock_adjustment',
            amount: absValue,
            referenceNo: adjustment.referenceNo ?? `ADJ-${adjustment.id}`,
            operationDate: adjustment.finalisedAt ?? new Date(),
            note: `GL post for Stock Adjustment #${adjustment.id} (Stock Loss)`,
            linkedTransactionId: adjustment.id,
            createdBy: adjustment.createdBy,
          },
        });

        await tx.accountTransaction.create({
          data: {
            accountId: inventoryAcc.id,
            type: 'credit',
            subType: 'stock_adjustment',
            amount: absValue,
            referenceNo: adjustment.referenceNo ?? `ADJ-${adjustment.id}`,
            operationDate: adjustment.finalisedAt ?? new Date(),
            note: `GL post for Stock Adjustment #${adjustment.id} (Stock Loss)`,
            linkedTransactionId: adjustment.id,
            createdBy: adjustment.createdBy,
          },
        });
      }
    });
  }

  async deletePaymentFromGL(paymentId: number) {
    await this.prisma.accountTransaction.deleteMany({
      where: {
        subType: 'payment',
        linkedTransactionId: paymentId,
      },
    });
  }
}
