export interface CustomerGroup {
  id: number;
  businessId: number;
  name: string;
  amount: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerGroupDto {
  name: string;
  amount?: number;
}
