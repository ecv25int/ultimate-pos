import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PAYMENT_REPOSITORY } from './domain/payment.repository';
import { PaymentStatusService } from './domain/payment-status.service';
import { PrismaPaymentRepository } from './infrastructure/prisma-payment.repository';
import { AddPaymentUseCase } from './application/use-cases/add-payment.use-case';
import { AddBulkPaymentsUseCase } from './application/use-cases/add-bulk-payments.use-case';
import { ListPaymentsUseCase } from './application/use-cases/list-payments.use-case';
import { FindPaymentUseCase } from './application/use-cases/find-payment.use-case';
import { DeletePaymentUseCase } from './application/use-cases/delete-payment.use-case';
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case';
import {
  PaymentsController,
  SalePaymentsController,
  PurchasePaymentsController,
} from './payments.controller';

const USE_CASES = [
  AddPaymentUseCase,
  AddBulkPaymentsUseCase,
  ListPaymentsUseCase,
  FindPaymentUseCase,
  DeletePaymentUseCase,
  GetBalanceUseCase,
];

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, SalePaymentsController, PurchasePaymentsController],
  providers: [
    PaymentStatusService,
    { provide: PAYMENT_REPOSITORY, useClass: PrismaPaymentRepository },
    ...USE_CASES,
  ],
  exports: USE_CASES,
})
export class PaymentsModule {}
