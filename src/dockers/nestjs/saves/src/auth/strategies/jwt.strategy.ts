import type { ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt"
import jwtConfig from "../config/jwt.config.js";
import { AuthJwtPayload } from "../types/auth-jwtPayload.js";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY) private jwtConfiguration: ConfigType<typeof jwtConfig>
  ) {
    const secret = jwtConfiguration.secret?.toString();
    if (!secret) {
      throw new Error('JWT SECRET environment variable is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret
    })
  }

  validate(payload: AuthJwtPayload) {
    return ({
      id: payload.sub
    });
  }
}