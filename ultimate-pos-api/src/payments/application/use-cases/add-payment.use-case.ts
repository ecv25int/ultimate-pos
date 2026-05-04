import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '../../domain/payment.repository';
import type { IPaymentRepository } from '../../domain/payment.repository';
import type { Payment } from '../../domain/payment.entity';
import { PaymentStatusService } from '../../domain/payment-status.service';
import type { CreatePaymentDto } from '../../dto/create-payment.dto';

@Injectable()
export class AddPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    private readonly statusSvc: PaymentStatusService,
  ) {}

  async execute(businessId: number, userId: number, dto: CreatePaymentDto): Promise<Payment> {
    if (!dto.saleId && !dto.purchaseId) {
      throw new BadRequestException('Either saleId or purchaseId is required');
    }

    let totalAmount = 0;
    let currentPaid = 0;

    if (dto.saleId) {
      const sale = await this.repo.findSale(dto.saleId, businessId);
      if (!sale) throw new NotFoundException(`Sale #${dto.saleId} not found`);
      totalAmount = sale.totalAmount;
      currentPaid = await this.repo.getTotalPaid(businessId, dto.saleId, undefined);
    }

    if (dto.purchaseId) {
      const purchase = await this.repo.findPurchase(dto.purchaseId, businessId);
      if (!purchase) throw new NotFoundException(`Purchase #${dto.purchaseId} not found`);
      totalAmount = purchase.totalAmount;
      currentPaid = await this.repo.getTotalPaid(businessId, undefined, dto.purchaseId);
    }

    if (this.statusSvc.wouldOverpay(currentPaid, dto.amount, totalAmount)) {
      const balance = this.statusSvc.getBalance(totalAmount, currentPaid);
      throw new BadRequestException(
        `Payment of ${dto.amount} exceeds remaining balance of ${balance.toFixed(2)}`,
      );
    }

    const payment = await this.repo.create({
      businessId,
      userId,
      saleId: dto.saleId ?? null,
      purchaseId: dto.purchaseId ?? null,
      amount: dto.amount,
      method: dto.method ?? 'cash',
      referenceNo: dto.referenceNo ?? null,
      note: dto.note ?? null,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
    });

    const newTotalPaid = currentPaid + dto.amount;
    const newStatus = this.statusSvc.calculate(newTotalPaid, totalAmount);

    if (dto.saleId) {
      await this.repo.updateSalePaymentStatus(dto.saleId, newTotalPaid, newStatus);
    }
    if (dto.purchaseId) {
      await this.repo.updatePurchasePaymentStatus(dto.purchaseId, newTotalPaid, newStatus);
    }

    return payment;
  }
}
