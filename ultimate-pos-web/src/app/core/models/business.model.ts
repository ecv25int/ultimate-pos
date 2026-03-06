export interface Business {
  id: number;
  name: string;
  currency: string;
  timezone: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  taxNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessDto {
  name: string;
  currency?: string;
  timezone?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  taxNumber?: string;
}

export interface BusinessLocation {
  id: number;
  businessId: number;
  name: string;
  landmarkCity?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  mobile?: string;
  alternateNumber?: string;
  email?: string;
  website?: string;
  featuredProducts: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessLocationDto {
  name: string;
  landmarkCity?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  mobile?: string;
  alternateNumber?: string;
  email?: string;
  website?: string;
  isActive?: boolean;
}
