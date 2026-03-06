export interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType: string;
  businessId?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  businessId?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenValidationResponse {
  valid: boolean;
  user: User;
}
