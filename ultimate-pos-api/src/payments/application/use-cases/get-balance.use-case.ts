import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '../../domain/payment.repository';
import type { IPaymentRepository } from '../../domain/payment.repository';
import { PaymentStatusService } from '../../domain/payment-status.service';

export interface BalanceResult {
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: string;
}

@Injectable()
export class GetBalanceUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    private readonly statusSvc: PaymentStatusService,
  ) {}

  async forSale(saleId: number, businessId: number): Promise<BalanceResult> {
    const sale = await this.repo.findSale(saleId, businessId);
    if (!sale) throw new NotFoundException(`Sale #${saleId} not found`);
    const paidAmount = await this.repo.getTotalPaid(businessId, saleId, undefined);
    return this.buildResult(sale.totalAmount, paidAmount);
  }

  async forPurchase(purchaseId: number, businessId: number): Promise<BalanceResult> {
    const purchase = await this.repo.findPurchase(purchaseId, businessId);
    if (!purchase) throw new NotFoundException(`Purchase #${purchaseId} not found`);
    const paidAmount = await this.repo.getTotalPaid(businessId, undefined, purchaseId);
    return this.buildResult(purchase.totalAmount, paidAmount);
  }

  async execute(businessId: number, saleId?: number, purchaseId?: number): Promise<BalanceResult> {
    if (!saleId && !purchaseId) throw new BadRequestException('saleId or purchaseId required');
    if (saleId) return this.forSale(saleId, businessId);
    return this.forPurchase(purchaseId!, businessId);
  }

  private buildResult(totalAmount: number, paidAmount: number): BalanceResult {
    return {
      totalAmount,
      paidAmount,
      balance: this.statusSvc.getBalance(totalAmount, paidAmount),
      paymentStatus: this.statusSvc.calculate(paidAmount, totalAmount),
    };
  }
}
