import { BadRequestException, Injectable } from '@nestjs/common';
import { AddPaymentUseCase } from './add-payment.use-case';
import type { Payment } from '../../domain/payment.entity';
import type { CreatePaymentDto } from '../../dto/create-payment.dto';

@Injectable()
export class AddBulkPaymentsUseCase {
  constructor(private readonly addPayment: AddPaymentUseCase) {}

  async execute(businessId: number, userId: number, dtos: CreatePaymentDto[]): Promise<{ created: number; payments: Payment[] }> {
    if (!dtos.length) throw new BadRequestException('No payments provided');

    const payments: Payment[] = [];
    for (const dto of dtos) {
      const payment = await this.addPayment.execute(businessId, userId, dto);
      payments.push(payment);
    }
    return { created: payments.length, payments };
  }
}
