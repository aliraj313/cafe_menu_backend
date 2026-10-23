import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SmsModule } from '../sms/sms.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OtpsRepository } from './otps.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { TokenService } from './token.service';
import { UsersRepository } from './users.repository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    UsersRepository,
    RefreshTokensRepository,
    OtpsRepository,
    JwtAccessStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, PassportModule, UsersRepository, JwtModule],
})
export class AuthModule {}
