import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '../../domain/payment.repository';
import type { IPaymentRepository } from '../../domain/payment.repository';
import { PaymentStatusService } from '../../domain/payment-status.service';

@Injectable()
export class DeletePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    private readonly statusSvc: PaymentStatusService,
  ) {}

  async execute(id: number, businessId: number): Promise<void> {
    const payment = await this.repo.findById(id, businessId);
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);

    await this.repo.delete(id);

    // Recalculate payment status after deletion
    if (payment.saleId) {
      const sale = await this.repo.findSale(payment.saleId, businessId);
      if (sale) {
        const totalPaid = await this.repo.getTotalPaid(businessId, payment.saleId, undefined);
        const status = this.statusSvc.calculate(totalPaid, sale.totalAmount);
        await this.repo.updateSalePaymentStatus(payment.saleId, totalPaid, status);
      }
    }

    if (payment.purchaseId) {
      const purchase = await this.repo.findPurchase(payment.purchaseId, businessId);
      if (purchase) {
        const totalPaid = await this.repo.getTotalPaid(businessId, undefined, payment.purchaseId);
        const status = this.statusSvc.calculate(totalPaid, purchase.totalAmount);
        await this.repo.updatePurchasePaymentStatus(payment.purchaseId, totalPaid, status);
      }
    }
  }
}
