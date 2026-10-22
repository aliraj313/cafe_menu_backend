import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigsService } from '../config/configs.service';
import { UnauthorizedException } from '../common/exceptions/app.exception';
import { AdminsRepository } from './admins.repository';
import { AuthTokensResponse } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminsRepository: AdminsRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly tokenService: TokenService,
    private readonly configs: ConfigsService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const admin = await this.adminsRepository.findByUsername(dto.username);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('INVALID_CREDENTIALS', 'Invalid username or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('INVALID_CREDENTIALS', 'Invalid username or password.');
    }

    return this.tokenService.issueTokens({ id: admin.id, username: admin.username });
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    let payload;
    try {
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN', 'Invalid refresh token type.');
    }

    const tokenHash = this.tokenService.hashToken(refreshToken);
    const stored = await this.refreshTokensRepository.findByTokenHash(tokenHash);
    if (!stored || stored.revokedAt !== null || stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN', 'Refresh token is revoked or expired.');
    }

    const admin = await this.adminsRepository.findById(payload.sub);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('ADMIN_INACTIVE', 'Admin account is not active.');
    }

    await this.refreshTokensRepository.revoke(stored.id, new Date());
    return this.tokenService.issueTokens({ id: admin.id, username: admin.username });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(refreshToken);
    const stored = await this.refreshTokensRepository.findByTokenHash(tokenHash);
    if (stored && stored.revokedAt === null) {
      await this.refreshTokensRepository.revoke(stored.id, new Date());
    }
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.configs.LIMITS.AUTH.BCRYPT_SALT_ROUNDS);
  }
}
