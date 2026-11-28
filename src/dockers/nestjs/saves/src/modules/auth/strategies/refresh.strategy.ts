import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthJwtPayload } from '../types/auth-jwtPayload.js';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import refreshJwtConfig from '../config/refresh-jwt.config.js';
import { AuthService } from '../auth.service.js';
import { FastifyRequest } from 'fastify';

// Shared extractor: 1. Cookie ('refreshToken') -> 2. Authorization Bearer Header
const extractRefreshToken = ExtractJwt.fromExtractors([
  (req: FastifyRequest) => req?.cookies?.refreshToken ?? null,
  ExtractJwt.fromAuthHeaderAsBearerToken(),
]);

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthService,
  ) {
    const secret = refreshJwtConfiguration.secret?.toString();

    if (!secret) {
      throw new Error('JWT SECRET environment variable is not defined');
    }

    super({
      jwtFromRequest: extractRefreshToken,
      secretOrKey: secret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(req: FastifyRequest, payload: AuthJwtPayload) {
    // Re-use the same extractor to get the raw token from either cookie or Bearer header
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies or Authorization header');
    }

    const userId = payload.sub;
    return this.authService.validateRefreshToken(userId, refreshToken);
  }
}
