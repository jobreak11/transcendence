import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthJwtPayload } from '../types/auth-jwtPayload.js';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import refreshJwtConfig from '../config/refresh-jwt.config.js';
import { AuthService } from '../auth.service.js';
import { FastifyRequest } from 'fastify';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthService,
  ) {
    const secret = refreshJwtConfiguration.secret?.toString();
    console.log('Verify Secret:', secret);

    if (!secret) {
      throw new Error('JWT SECRET environment variable is not defined');
    }

    super({
      // 1. Extract the JWT from the 'refreshToken' cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: FastifyRequest) => {
          return req?.cookies?.refreshToken ?? null;
        },
      ]),
      secretOrKey: secret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  // 2. Pass the cookie value to validateRefreshToken
  validate(req: FastifyRequest, payload: AuthJwtPayload) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const userId = payload.sub;
    return this.authService.validateRefreshToken(userId, refreshToken);
  }
}
