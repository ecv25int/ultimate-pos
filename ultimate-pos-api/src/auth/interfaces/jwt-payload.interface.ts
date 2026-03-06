export interface JwtPayload {
  sub: number; // User ID
  username: string;
  email?: string;
  businessId?: number;
  userType: string;
}
