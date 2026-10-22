import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigsService } from '../config/configs.service';
import { UnauthorizedException } from '../common/exceptions/app.exception';
import { AuthTokensResponse } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { TokenService } from './token.service';
import { UsersRepository } from './users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly tokenService: TokenService,
    private readonly configs: ConfigsService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const user = await this.usersRepository.findByUsername(dto.username);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('INVALID_CREDENTIALS', 'Invalid username or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('INVALID_CREDENTIALS', 'Invalid username or password.');
    }

    return this.tokenService.issueTokens({ id: user.id, username: user.username });
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

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('USER_INACTIVE', 'User account is not active.');
    }

    await this.refreshTokensRepository.revoke(stored.id, new Date());
    return this.tokenService.issueTokens({ id: user.id, username: user.username });
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
