export interface AccessTokenPayload {
  sub: number;
  username: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: number;
  username: string;
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
  };
}
