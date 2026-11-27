import { Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { FastifyRequest } from "fastify";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service.js";
import refreshJwtConfig from "../config/refresh-jwt.config.js";
import { AuthJwtPayload } from "../types/auth-jwtPayload.js";

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, "refresh-jwt") {

  private readonly logger = new Logger(RefreshJwtStrategy.name);

  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthService,
  ) {
    const secret = refreshJwtConfiguration.secret?.toString();
    if (!secret) {
      throw new Error("REFRESH_JWT_SECRET environment variable is not defined");
    }

    console.log('Strategy Refresh Secret:', secret);

    super({
      // jwtFromRequest: ()ExtractJwt.fromExtractors([
      //   ExtractJwt.fromAuthHeaderAsBearerToken(),
      //   RefreshJwtStrategy.extractFromCookie,
      // ]),
      jwtFromRequest: (req: FastifyRequest) => {
            const fromCookie = RefreshJwtStrategy.extractFromCookie(req);
    const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const chosenToken = fromCookie || fromHeader;

    console.log('--- [VERIFYING REFRESH TOKEN] ---');
    console.log('1. Strategy Secret:', secret);
    console.log('2. Token from Cookie:', fromCookie?.slice(-15)); // Last 15 chars (signature part)
    console.log('3. Token from Header:', fromHeader?.slice(-15)); // Last 15 chars (signature part)
    console.log('4. Chosen Token:', chosenToken?.slice(-15));

    return chosenToken;
      },
      secretOrKey: secret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(req: FastifyRequest, payload: AuthJwtPayload) {

    this.logger.error(" REFRESH STRATEGY REACHED ")

    const authHeader = req.headers.authorization;
    const refreshToken = authHeader?.match(/^Bearer\s+/i)
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is missing");
    }

    return this.authService.validateRefreshToken(payload.sub, refreshToken);
  }

  private static extractFromCookie(request: FastifyRequest): string | null {
    return request.cookies?.refreshToken ?? null;
  }
}
