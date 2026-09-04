import type { ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt"
import jwtConfig from "../config/jwt.config.js";
import { AuthJwtPayload } from "../types/auth-jwtPayload.js";
import { Inject, Injectable } from "@nestjs/common";
import { AuthService } from "../auth.service.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY) private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private authService: AuthService
  ) {
    const secret = jwtConfiguration.secret?.toString();
    if (!secret) {
      throw new Error('JWT SECRET environment variable is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false
    })
  }

  validate(payload: AuthJwtPayload) {
    const userId = payload.sub;
    return this.authService.validateJwtUser(userId);
  }
}