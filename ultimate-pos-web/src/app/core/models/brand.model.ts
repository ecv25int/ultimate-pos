export interface Brand {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandDto {
  name: string;
  description?: string;
}
