import { UserRole } from '../generated/prisma/client';

export interface AccessTokenPayload {
  sub: number;
  username: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: number;
  username: string;
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
    username: string;
    role: UserRole;
  };
}
