import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigsService } from '../../config/configs.service';
import { UnauthorizedException } from '../../common/exceptions/app.exception';
import { AuthenticatedAdmin } from '../decorators/current-admin.decorator';
import { AccessTokenPayload } from '../auth.types';
import { AdminsRepository } from '../admins.repository';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configs: ConfigsService,
    private readonly adminsRepository: AdminsRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configs.JWT.ACCESS.SECRET,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedAdmin> {
    if (payload.type !== 'access' || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN', 'Invalid access token.');
    }

    const admin = await this.adminsRepository.findById(payload.sub);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('ADMIN_INACTIVE', 'Admin account is not active.');
    }

    return { id: admin.id, username: admin.username };
  }
}
