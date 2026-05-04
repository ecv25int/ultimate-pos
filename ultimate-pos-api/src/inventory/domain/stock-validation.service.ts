export class StockValidationService {
  isAvailable(currentStock: number, requested: number): boolean {
    return currentStock >= requested;
  }

  isLowStock(currentStock: number, alertQuantity: number): boolean {
    return currentStock <= alertQuantity;
  }

  isOutOfStock(currentStock: number): boolean {
    return currentStock <= 0;
  }
}
