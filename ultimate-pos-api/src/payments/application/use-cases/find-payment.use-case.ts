import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '../../domain/payment.repository';
import type { IPaymentRepository } from '../../domain/payment.repository';
import type { Payment } from '../../domain/payment.entity';

@Injectable()
export class FindPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  async execute(id: number, businessId: number): Promise<Payment> {
    const payment = await this.repo.findById(id, businessId);
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }
}
