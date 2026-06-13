import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TransactionStateService } from '../../domain/transaction-state.service';
import type { Transaction } from '../../domain/transaction.entity';
import type { ITransactionRepository } from '../../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/transaction.repository';
import { CreateTransactionDto } from '../../dto/create-transaction.dto';
import { RefNumberService } from '../ref-number.service';

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: ITransactionRepository,
    private readonly refNumbers: RefNumberService,
    private readonly stateService: TransactionStateService,
  ) {}

  async execute(
    businessId: number,
    userId: number,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    if (dto.type === 'stock_transfer') {
      if (!dto.productId || !dto.quantity || !dto.fromLocation || !dto.toLocation) {
        throw new BadRequestException(
          'stock_transfer requires productId, quantity, fromLocation and toLocation',
        );
      }
    }

    const refNo = await this.refNumbers.getNextRefNo(dto.type, businessId);
    const status = dto.status ?? this.stateService.initialStatusForType(dto.type);
    const amounts = this.resolveAmounts(dto);

    return this.repo.create({
      type: dto.type,
      businessId,
      userId,
      refNo,
      status,
      contactId: dto.contactId ?? null,
      locationId: dto.locationId ?? null,
      paymentStatus: dto.paymentStatus,
      note: dto.note ?? null,
      date: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
      ...amounts,
      expenseCategoryId: dto.expenseCategoryId ?? null,
      productId: dto.productId,
      quantity: dto.quantity,
      fromLocation: dto.fromLocation,
      toLocation: dto.toLocation,
      adjustmentType: dto.adjustmentType,
    });
  }

  private resolveAmounts(dto: CreateTransactionDto) {
    const totalBeforeTax = dto.totalBeforeTax ?? 0;
    const taxAmount = dto.taxAmount ?? 0;
    const discountAmount = dto.discountAmount ?? 0;
    const totalAmount = dto.totalAmount ?? Math.max(totalBeforeTax + taxAmount - discountAmount, 0);
    return { totalBeforeTax, taxAmount, discountAmount, totalAmount };
  }
}
