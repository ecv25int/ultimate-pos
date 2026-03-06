export type DurationType = 'days' | 'months' | 'years';

export interface Warranty {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  duration: number;
  durationType: DurationType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarrantyDto {
  name: string;
  description?: string;
  duration: number;
  durationType: DurationType;
}
