import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SaleReturnValidatorService } from '../../domain/sale-return-validator.service';
import type { SaleReturn } from '../../domain/sale-return.entity';
import type { ISaleReturnRepository } from '../../domain/sale-return.repository';
import { SALE_RETURN_REPOSITORY } from '../../domain/sale-return.repository';
import { CreateSaleReturnDto } from '../../dto/create-sale-return.dto';

@Injectable()
export class CreateSaleReturnUseCase {
  constructor(
    @Inject(SALE_RETURN_REPOSITORY)
    private readonly repo: ISaleReturnRepository,
    private readonly validator: SaleReturnValidatorService,
  ) {}

  async execute(
    saleId: number,
    businessId: number,
    userId: number,
    dto: CreateSaleReturnDto,
  ): Promise<SaleReturn> {
    const original = await this.repo.findOriginalWithLines(saleId, businessId);
    if (!original) throw new NotFoundException(`Sale #${saleId} not found`);

    const { valid, errors } = this.validator.validate(original, dto.lines);
    if (!valid) throw new BadRequestException(errors.join('; '));

    const computedLines = this.validator.calculateLineTotals(original, dto.lines);
    const totalAmount = computedLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const totalTax = computedLines.reduce((sum, l) => sum + l.taxAmount, 0);
    const totalDiscount = computedLines.reduce((sum, l) => sum + l.discountAmount, 0);

    const invoiceNo = await this.repo.generateInvoiceNo(businessId);

    return this.repo.create({
      businessId,
      userId,
      invoiceNo,
      contactId: original.contactId,
      returnOfId: saleId,
      totalAmount,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      shippingAmount: 0,
      paidAmount: totalAmount,
      note: dto.note ?? `Return for ${original.invoiceNo}`,
      lines: computedLines.map((l) => ({ ...l, note: undefined })),
    });
  }
}
