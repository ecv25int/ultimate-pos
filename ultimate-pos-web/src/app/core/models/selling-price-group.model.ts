export interface SellingPriceGroup {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  isActive: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellingPriceGroupDto {
  name: string;
  description?: string;
  isActive?: boolean;
}
