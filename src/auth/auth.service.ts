import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'crypto';
import { OtpPurpose, UserRole } from '../generated/prisma/client';
import { BusinessRuleException, UnauthorizedException } from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { SMS_SERVICE, SmsService } from '../sms/sms.service';
import { AuthTokensResponse, ForgotPasswordResponse } from './auth.types';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RequestLoginOtpDto } from './dto/request-login-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { OtpsRepository } from './otps.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { TokenService } from './token.service';
import { UsersRepository } from './users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly otpsRepository: OtpsRepository,
    private readonly tokenService: TokenService,
    private readonly configs: ConfigsService,
    @Inject(SMS_SERVICE) private readonly smsService: SmsService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const user = await this.usersRepository.findByMobile(dto.mobile);
    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('INVALID_CREDENTIALS', 'Invalid mobile or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('INVALID_CREDENTIALS', 'Invalid mobile or password.');
    }

    return this.tokenService.issueTokens({
      id: user.id,
      mobile: user.mobile,
      role: user.role,
    });
  }

  async requestLoginOtp(dto: RequestLoginOtpDto): Promise<ForgotPasswordResponse> {
    const mobile = dto.mobile;
    const now = new Date();

    const latest = await this.otpsRepository.findLatest(mobile, OtpPurpose.LOGIN);
    if (latest) {
      const elapsedMs = now.getTime() - latest.createdAt.getTime();
      const cooldownMs = this.configs.OTP.RESEND_COOLDOWN_SECONDS * 1000;
      if (elapsedMs < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        throw new BusinessRuleException(
          'OTP_RESEND_COOLDOWN',
          `Please wait ${waitSeconds} seconds before requesting another OTP.`,
          [{ resendAvailableInSeconds: waitSeconds }],
        );
      }
    }

    const otp = this.generateOtp();
    const codeHash = this.hashOtp(otp);
    const expiresAt = new Date(now.getTime() + this.configs.OTP.TTL_SECONDS * 1000);

    const existingUser = await this.usersRepository.findByMobile(mobile);
    await this.otpsRepository.create({
      mobile,
      purpose: OtpPurpose.LOGIN,
      userId: existingUser?.id,
      codeHash,
      expiresAt,
    });

    await this.smsService.send({
      to: mobile,
      text: `Cafe Menu login code: ${otp}`,
    });

    return {
      message: 'OTP has been sent.',
      resendAvailableInSeconds: this.configs.OTP.RESEND_COOLDOWN_SECONDS,
    };
  }

  async verifyLoginOtp(dto: VerifyLoginOtpDto): Promise<AuthTokensResponse> {
    const now = new Date();
    const otpRecord = await this.otpsRepository.findLatestActive(
      dto.mobile,
      OtpPurpose.LOGIN,
      now,
    );

    if (!otpRecord) {
      throw new UnauthorizedException('INVALID_OTP', 'Invalid or expired OTP.');
    }

    if (otpRecord.attemptCount >= this.configs.OTP.MAX_ATTEMPTS) {
      throw new BusinessRuleException(
        'OTP_MAX_ATTEMPTS_EXCEEDED',
        'Maximum OTP verification attempts exceeded. Request a new code.',
      );
    }

    const matches = this.hashOtp(dto.otp) === otpRecord.codeHash;
    if (!matches) {
      await this.otpsRepository.incrementAttempts(otpRecord.id);
      throw new UnauthorizedException('INVALID_OTP', 'Invalid or expired OTP.');
    }

    const user = await this.usersRepository.upsertByMobile(dto.mobile, UserRole.CUSTOMER);

    await this.otpsRepository.consume(otpRecord.id, now);
    await this.otpsRepository.consumeAllActive(dto.mobile, OtpPurpose.LOGIN, now);

    return this.tokenService.issueTokens({
      id: user.id,
      mobile: user.mobile,
      role: user.role,
    });
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
    return this.tokenService.issueTokens({
      id: user.id,
      mobile: user.mobile,
      role: user.role,
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(refreshToken);
    const stored = await this.refreshTokensRepository.findByTokenHash(tokenHash);
    if (stored && stored.revokedAt === null) {
      await this.refreshTokensRepository.revoke(stored.id, new Date());
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    const user = await this.usersRepository.findByMobile(dto.mobile);
    const generic: ForgotPasswordResponse = {
      message: 'If the mobile number is registered, an OTP has been sent.',
      resendAvailableInSeconds: this.configs.OTP.RESEND_COOLDOWN_SECONDS,
    };

    if (!user || !user.isActive || !user.passwordHash) {
      return generic;
    }

    const now = new Date();
    const latest = await this.otpsRepository.findLatest(user.mobile, OtpPurpose.PASSWORD_RESET);
    if (latest) {
      const elapsedMs = now.getTime() - latest.createdAt.getTime();
      const cooldownMs = this.configs.OTP.RESEND_COOLDOWN_SECONDS * 1000;
      if (elapsedMs < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        throw new BusinessRuleException(
          'OTP_RESEND_COOLDOWN',
          `Please wait ${waitSeconds} seconds before requesting another OTP.`,
          [{ resendAvailableInSeconds: waitSeconds }],
        );
      }
    }

    const otp = this.generateOtp();
    const codeHash = this.hashOtp(otp);
    const expiresAt = new Date(now.getTime() + this.configs.OTP.TTL_SECONDS * 1000);

    await this.otpsRepository.create({
      mobile: user.mobile,
      purpose: OtpPurpose.PASSWORD_RESET,
      userId: user.id,
      codeHash,
      expiresAt,
    });

    await this.smsService.send({
      to: user.mobile,
      text: `Cafe Menu password reset code: ${otp}`,
    });

    return generic;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findByMobile(dto.mobile);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('INVALID_OTP', 'Invalid OTP or mobile number.');
    }

    const now = new Date();
    const otpRecord = await this.otpsRepository.findLatestActive(
      user.mobile,
      OtpPurpose.PASSWORD_RESET,
      now,
    );
    if (!otpRecord) {
      throw new UnauthorizedException('INVALID_OTP', 'Invalid or expired OTP.');
    }

    if (otpRecord.attemptCount >= this.configs.OTP.MAX_ATTEMPTS) {
      throw new BusinessRuleException(
        'OTP_MAX_ATTEMPTS_EXCEEDED',
        'Maximum OTP verification attempts exceeded. Request a new code.',
      );
    }

    const matches = this.hashOtp(dto.otp) === otpRecord.codeHash;
    if (!matches) {
      await this.otpsRepository.incrementAttempts(otpRecord.id);
      throw new UnauthorizedException('INVALID_OTP', 'Invalid or expired OTP.');
    }

    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      this.configs.LIMITS.AUTH.BCRYPT_SALT_ROUNDS,
    );

    await this.usersRepository.updatePassword(user.id, passwordHash);
    await this.otpsRepository.consume(otpRecord.id, now);
    await this.otpsRepository.consumeAllActive(user.mobile, OtpPurpose.PASSWORD_RESET, now);
    await this.refreshTokensRepository.revokeAllForUser(user.id, now);

    return { message: 'Password has been reset successfully.' };
  }

  private generateOtp(): string {
    const max = 10 ** this.configs.LIMITS.AUTH.OTP_LENGTH;
    const min = 10 ** (this.configs.LIMITS.AUTH.OTP_LENGTH - 1);
    return String(randomInt(min, max));
  }

  private hashOtp(otp: string): string {
    return createHash('sha256')
      .update(`${otp}:${this.configs.OTP.PEPPER}`)
      .digest('hex');
  }
}
