export type ContactType = 'customer' | 'supplier' | 'both';
export type ContactStatus = 'active' | 'inactive';
export type PayTermType = 'days' | 'months';

export interface Contact {
  id: number;
  businessId: number;
  type: ContactType;
  name: string;
  supplierBusinessName?: string;
  email?: string;
  taxNumber?: string;
  mobile: string;
  landline?: string;
  alternateNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  landmark?: string;
  shippingAddress?: string;
  position?: string;
  payTermNumber?: number;
  payTermType?: PayTermType;
  creditLimit?: number;
  balance: number;
  isDefault: boolean;
  contactStatus: ContactStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListItem {
  id: number;
  type: ContactType;
  name: string;
  supplierBusinessName?: string;
  email?: string;
  mobile: string;
  city?: string;
  state?: string;
  country?: string;
  creditLimit?: number;
  balance: number;
  contactStatus: ContactStatus;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateContactDto {
  type: ContactType;
  name: string;
  supplierBusinessName?: string;
  email?: string;
  taxNumber?: string;
  mobile: string;
  landline?: string;
  alternateNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  landmark?: string;
  shippingAddress?: string;
  position?: string;
  payTermNumber?: number;
  payTermType?: PayTermType;
  creditLimit?: number;
  isDefault?: boolean;
  contactStatus?: ContactStatus;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {}
