import { StockEntry } from '../domain/stock-entry.entity';

export class StockEntryMapper {
  static toEntity(row: any): StockEntry {
    return new StockEntry({
      id: row.id,
      businessId: row.businessId,
      productId: row.productId,
      entryType: row.entryType,
      quantity:
        typeof row.quantity === 'object' && 'toNumber' in row.quantity
          ? row.quantity.toNumber()
          : Number(row.quantity ?? 0),
      unitCost:
        row.unitCost != null
          ? typeof row.unitCost === 'object' && 'toNumber' in row.unitCost
            ? row.unitCost.toNumber()
            : Number(row.unitCost)
          : null,
      referenceNo: row.referenceNo ?? null,
      note: row.note ?? null,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    });
  }
}
