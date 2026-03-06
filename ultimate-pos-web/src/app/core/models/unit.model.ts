export interface Unit {
  id: number;
  businessId: number;
  actualName: string;
  shortName: string;
  allowDecimal: boolean;
  baseUnitId?: number;
  baseUnitMultiplier?: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  baseUnit?: Unit;
  subUnits?: Unit[];
}

export interface CreateUnitDto {
  actualName: string;
  shortName: string;
  allowDecimal?: boolean;
  baseUnitId?: number;
  baseUnitMultiplier?: number;
}
