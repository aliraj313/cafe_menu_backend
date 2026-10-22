import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UnauthorizedException } from '../../common/exceptions/app.exception';
import { ConfigsService } from '../../config/configs.service';
import { AccessTokenPayload } from '../auth.types';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { UsersRepository } from '../users.repository';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configs: ConfigsService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configs.JWT.ACCESS.SECRET,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access' || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN', 'Invalid access token.');
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('USER_INACTIVE', 'User account is not active.');
    }

    return { id: user.id, mobile: user.mobile, role: user.role };
  }
}
