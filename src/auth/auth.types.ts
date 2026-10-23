import { UserRole } from '../generated/prisma/client';

export interface AccessTokenPayload {
  sub: number;
  mobile: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: number;
  mobile: string;
  role: UserRole;
  type: 'refresh';
  jti: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: number;
    mobile: string;
    role: UserRole;
  };
}

export interface ForgotPasswordResponse {
  message: string;
  otp?: string;
  resendAvailableInSeconds: number;
}
