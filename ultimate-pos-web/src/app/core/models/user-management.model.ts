export type UserType = 'admin' | 'manager' | 'cashier' | 'user';

export interface StaffUser {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType: UserType;
  businessId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  total: number;
  active: number;
  inactive: number;
  byType: Array<{ type: string; count: number }>;
}

export interface UserListResponse {
  data: StaffUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserDto {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: UserType;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: UserType;
  isActive?: boolean;
}
