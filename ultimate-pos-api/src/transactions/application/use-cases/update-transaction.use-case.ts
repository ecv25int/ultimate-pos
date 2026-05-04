import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionStateService } from '../../domain/transaction-state.service';
import type { TransactionType } from '../../domain/transaction-type';
import type { Transaction } from '../../domain/transaction.entity';
import type { ITransactionRepository } from '../../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/transaction.repository';
import { UpdateTransactionDto } from '../../dto/update-transaction.dto';

@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: ITransactionRepository,
    private readonly stateService: TransactionStateService,
  ) {}

  async execute(
    id: number,
    businessId: number,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const type = dto.type ?? (await this.resolveType(id, businessId));
    const existing = await this.repo.findById(id, businessId, type);
    if (!existing) throw new NotFoundException(`Transaction #${id} not found`);

    if (!existing.canBeUpdated()) {
      throw new BadRequestException(
        `Transactions with status '${existing.status}' cannot be edited`,
      );
    }

    const totalBeforeTax = dto.totalBeforeTax ?? existing.totalBeforeTax;
    const taxAmount = dto.taxAmount ?? existing.taxAmount;
    const discountAmount = dto.discountAmount ?? existing.discountAmount;
    const totalAmount =
      dto.totalAmount ?? Math.max(totalBeforeTax + taxAmount - discountAmount, 0);

    return this.repo.update(
      id,
      businessId,
      {
        contactId: dto.contactId,
        locationId: dto.locationId,
        paymentStatus: dto.paymentStatus,
        note: dto.note,
        date: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
        totalBeforeTax,
        taxAmount,
        discountAmount,
        totalAmount,
        expenseCategoryId: dto.expenseCategoryId,
        productId: dto.productId,
        quantity: dto.quantity,
        fromLocation: dto.fromLocation,
        toLocation: dto.toLocation,
        adjustmentType: dto.adjustmentType,
      },
      type,
    );
  }

  private async resolveType(id: number, businessId: number): Promise<TransactionType> {
    const type = await this.repo.inferType(id, businessId);
    if (!type) throw new NotFoundException(`Transaction #${id} not found`);
    return type;
  }
}
