import type { ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt"
import jwtConfig from "../config/jwt.config.js";
import { AuthJwtPayload } from "../types/auth-jwtPayload.js";
import { Inject, Injectable } from "@nestjs/common";
import refreshJwtConfig from "../config/refresh-jwt.config.js";
import { AuthService } from "../auth.service.js";
import { StringValue } from 'ms'
import { FastifyRequest } from "fastify";

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    @Inject(refreshJwtConfig.KEY) private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthService
  ) {
    const secret = refreshJwtConfiguration.secret?.toString();
    if (!secret) {
      throw new Error('JWT SECRET environment variable is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
      passReqToCallback: true
    })
  }

  validate(req: FastifyRequest, payload: AuthJwtPayload) {
    const refreshToken = (req.headers.authorization?.replace('Bearer', '').trim() ?? '') as StringValue;
    const userId = payload.sub;


    return this.authService.validateRefreshToken(userId, refreshToken)
    return ({
      id: payload.sub
    });
  }
}