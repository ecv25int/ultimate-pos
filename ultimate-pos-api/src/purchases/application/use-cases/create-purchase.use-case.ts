import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Purchase } from '../../domain/purchase.entity';
import type { IPurchaseRepository } from '../../domain/purchase.repository';
import { PURCHASE_REPOSITORY } from '../../domain/purchase.repository';
import { LandedCostService } from '../../domain/landed-cost.service';
import { CreatePurchaseDto, PurchaseStatus } from '../../dto/create-purchase.dto';
import { PostingService } from '../../../accounting/posting.service';

@Injectable()
export class CreatePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly repo: IPurchaseRepository,
    private readonly landedCost: LandedCostService,
    private readonly postingService: PostingService,
  ) {}

  async execute(businessId: number, userId: number, dto: CreatePurchaseDto): Promise<Purchase> {
    if (!dto.lines?.length) {
      throw new BadRequestException('Purchase must have at least one line item');
    }

    const refNo = dto.refNo ?? (await this.repo.generateRefNo(businessId));

    const inputLines = dto.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitCostBefore: l.unitCostBefore,
      discountAmount: l.discountAmount ?? 0,
      taxAmount: l.taxAmount ?? 0,
      note: l.note,
    }));

    const computedLines = this.landedCost.allocate(
      inputLines,
      dto.freightAmount ?? 0,
      dto.dutyAmount ?? 0,
    );

    const linesSubtotal = computedLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const discount = dto.discountAmount ?? 0;
    const tax = dto.taxAmount ?? 0;
    const shipping = dto.shippingAmount ?? 0;
    const totalAmount = linesSubtotal - discount + tax + shipping;

    const paidAmount = dto.paidAmount ?? 0;
    let paymentStatus = dto.paymentStatus ?? 'due';
    if (!dto.paymentStatus) {
      if (paidAmount >= totalAmount) paymentStatus = 'paid';
      else if (paidAmount > 0) paymentStatus = 'partial';
    }

    const status = dto.status ?? PurchaseStatus.RECEIVED;

    const purchase = await this.repo.create({
      businessId,
      userId,
      refNo,
      contactId: dto.contactId ?? null,
      status,
      paymentStatus,
      type: dto.type ?? 'purchase',
      taxAmount: tax,
      discountAmount: discount,
      shippingAmount: shipping,
      totalAmount,
      paidAmount,
      note: dto.note ?? null,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
      addStock: status === PurchaseStatus.RECEIVED,
      lines: computedLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitCostBefore: l.unitCostBefore,
        unitCostAfter: l.unitCostAfter,
        discountAmount: l.discountAmount ?? 0,
        taxAmount: l.taxAmount ?? 0,
        lineTotal: l.lineTotal,
        note: l.note,
      })),
    });

    if (purchase.status === 'received') {
      await this.postingService.postPurchaseToGL(businessId, purchase.id);
    }

    return purchase;
  }
}
