export interface VariationTemplate {
  id: number;
  businessId: number;
  name: string;
  variationValues: VariationValueTemplate[];
  createdAt: string;
  updatedAt: string;
}

export interface VariationValueTemplate {
  id: number;
  variationTemplateId: number;
  name: string;
}

export interface ProductVariation {
  id: number;
  productId: number;
  name: string;
  isDummy: boolean;
  variations: Variation[];
}

export interface Variation {
  id: number;
  productId: number;
  productVariationId: number;
  name: string;
  subSku?: string;
  defaultPurchasePrice?: number;
  dppIncTax: number;
  profitPercent: number;
  defaultSellPrice?: number;
  sellPriceIncTax?: number;
  deletedAt?: string;
  productVariation?: ProductVariation;
  groupPrices?: VariationGroupPrice[];
  locationDetails?: VariationLocationDetails[];
}

export interface VariationGroupPrice {
  id: number;
  variationId: number;
  priceGroupId: number;
  priceIncTax: number;
}

export interface VariationLocationDetails {
  id: number;
  productId: number;
  productVariationId: number;
  variationId: number;
  locationId: number;
  qtyAvailable: number;
}

export interface CreateVariationTemplateDto {
  name: string;
}

export interface CreateVariationDto {
  productId: number;
  productVariationId: number;
  name: string;
  subSku?: string;
  defaultPurchasePrice?: number;
  dppIncTax?: number;
  profitPercent?: number;
  defaultSellPrice?: number;
  sellPriceIncTax?: number;
}
