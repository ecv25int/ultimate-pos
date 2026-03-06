export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    userType: string;
    businessId?: number | null;
  };
}
