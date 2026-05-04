import type { SaleReturn, SaleReturnLine } from '../domain/sale-return.entity';

export class SaleReturnLineDto {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  note: string | null;

  static fromEntity(l: SaleReturnLine): SaleReturnLineDto {
    return Object.assign(new SaleReturnLineDto(), l);
  }
}

export class SaleReturnDto {
  id: number;
  businessId: number;
  contactId: number | null;
  invoiceNo: string;
  status: string;
  paymentStatus: string;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount: number;
  note: string | null;
  returnDate: string;
  returnOfId: number;
  lines: SaleReturnLineDto[];

  static fromEntity(entity: SaleReturn): SaleReturnDto {
    const dto = new SaleReturnDto();
    Object.assign(dto, entity);
    dto.returnDate = entity.returnDate.toISOString();
    dto.lines = entity.lines.map(SaleReturnLineDto.fromEntity);
    return dto;
  }
}
