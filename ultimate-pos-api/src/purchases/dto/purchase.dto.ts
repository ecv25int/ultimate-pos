import type { Purchase } from '../domain/purchase.entity';

export class PurchaseLineDto {
  id: number;
  productId: number;
  quantity: number;
  unitCostBefore: number;
  unitCostAfter: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  note: string | null;
}

export class PurchaseDto {
  id: number;
  businessId: number;
  contactId: number | null;
  refNo: string;
  status: string;
  paymentStatus: string;
  type: string;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount: number;
  note: string | null;
  purchaseDate: Date;
  returnOfId: number | null;
  createdBy: number;
  lines: PurchaseLineDto[];

  static fromEntity(entity: Purchase): PurchaseDto {
    const dto = new PurchaseDto();
    dto.id = entity.id;
    dto.businessId = entity.businessId;
    dto.contactId = entity.contactId;
    dto.refNo = entity.refNo;
    dto.status = entity.status;
    dto.paymentStatus = entity.paymentStatus;
    dto.type = entity.type;
    dto.taxAmount = entity.taxAmount;
    dto.discountAmount = entity.discountAmount;
    dto.shippingAmount = entity.shippingAmount;
    dto.totalAmount = entity.totalAmount;
    dto.paidAmount = entity.paidAmount;
    dto.note = entity.note;
    dto.purchaseDate = entity.purchaseDate;
    dto.returnOfId = entity.returnOfId;
    dto.createdBy = entity.createdBy;
    dto.lines = entity.lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      quantity: l.quantity,
      unitCostBefore: l.unitCostBefore,
      unitCostAfter: l.unitCostAfter,
      discountAmount: l.discountAmount,
      taxAmount: l.taxAmount,
      lineTotal: l.lineTotal,
      note: l.note,
    }));
    return dto;
  }
}
