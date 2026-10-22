import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { ConfigsService } from '../config/configs.service';
import { AccessTokenPayload, AuthTokensResponse, RefreshTokenPayload } from './auth.types';
import { RefreshTokensRepository } from './refresh-tokens.repository';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configs: ConfigsService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async issueTokens(admin: { id: number; username: string }): Promise<AuthTokensResponse> {
    const accessPayload: AccessTokenPayload = {
      sub: admin.id,
      username: admin.username,
      type: 'access',
    };

    const jti = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: admin.id,
      username: admin.username,
      type: 'refresh',
      jti,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configs.JWT.ACCESS.SECRET,
      expiresIn: this.configs.JWT.ACCESS.TTL as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configs.JWT.REFRESH.SECRET,
      expiresIn: this.configs.JWT.REFRESH.TTL as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const expiresAt = this.computeExpiryDate(this.configs.JWT.REFRESH.TTL);
    await this.refreshTokensRepository.create({
      tokenHash: this.hashToken(refreshToken),
      adminId: admin.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configs.JWT.ACCESS.TTL,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.configs.JWT.REFRESH.SECRET,
    });
  }

  private computeExpiryDate(ttl: string): Date {
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());
    if (!match) {
      // Fallback: 7 days if TTL format is unexpected (should be validated via env in production configs).
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + amount * multipliers[unit]);
  }
}
