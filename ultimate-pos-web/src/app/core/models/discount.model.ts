export interface Discount {
  id: number;
  businessId: number;
  name: string;
  brandId?: number;
  categoryId?: number;
  locationId?: number;
  priority?: number;
  discountType?: string;
  discountAmount: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  applicableInSpg: boolean;
  applicableInCg: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountDto {
  name: string;
  brandId?: number;
  categoryId?: number;
  locationId?: number;
  priority?: number;
  discountType?: string;
  discountAmount?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  applicableInSpg?: boolean;
  applicableInCg?: boolean;
}
