export type TaxRateType = 'percentage' | 'fixed';

export interface TaxRate {
  id: number;
  businessId: number;
  name: string;
  rate: number;
  type: TaxRateType;
  isDefault: boolean;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupSubTax {
  groupTaxId: number;
  taxId: number;
  subTax: TaxRate;
}

export interface TaxRateWithSubTaxes extends TaxRate {
  groupSubTaxesAsGroup: GroupSubTax[];
}

export interface CreateTaxRateDto {
  name: string;
  rate: number;
  type?: TaxRateType;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface SetGroupSubTaxesDto {
  taxIds: number[];
}
