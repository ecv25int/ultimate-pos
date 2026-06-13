export interface LineInput {
  productId: number;
  quantity: number;
  unitCostBefore: number;
  discountAmount?: number;
  taxAmount?: number;
  note?: string;
}

export interface LineWithLandedCost extends LineInput {
  unitCostAfter: number;
  lineTotal: number;
}

export class LandedCostService {
  /**
   * Allocates freight and duty proportionally across lines by base cost weight,
   * producing the final unitCostAfter per line.
   */
  allocate(lines: LineInput[], freightTotal: number, dutyTotal: number): LineWithLandedCost[] {
    const baseCostTotal = lines.reduce((sum, l) => sum + l.quantity * l.unitCostBefore, 0);
    const overhead = freightTotal + dutyTotal;

    return lines.map((line) => {
      const baseCost = line.quantity * line.unitCostBefore;
      const weight = baseCostTotal > 0 ? baseCost / baseCostTotal : 1 / lines.length;
      const allocatedOverhead = overhead * weight;
      const unitCostAfter =
        line.unitCostBefore + (line.quantity > 0 ? allocatedOverhead / line.quantity : 0);

      const discountAmount = line.discountAmount ?? 0;
      const taxAmount = line.taxAmount ?? 0;
      const lineTotal = Number(
        (line.quantity * unitCostAfter - discountAmount + taxAmount).toFixed(4),
      );

      return { ...line, unitCostAfter: Number(unitCostAfter.toFixed(6)), lineTotal };
    });
  }

  /**
   * Simple passthrough: no overhead, unitCostAfter = unitCostBefore.
   */
  noOverhead(lines: LineInput[]): LineWithLandedCost[] {
    return this.allocate(lines, 0, 0);
  }
}
