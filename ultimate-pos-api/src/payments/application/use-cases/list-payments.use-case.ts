import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '../../domain/payment.repository';
import type { IPaymentRepository, PaymentFilters, PaginatedPayments } from '../../domain/payment.repository';

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  execute(businessId: number, filters: PaymentFilters): Promise<PaginatedPayments> {
    return this.repo.findAll(businessId, filters);
  }
}
