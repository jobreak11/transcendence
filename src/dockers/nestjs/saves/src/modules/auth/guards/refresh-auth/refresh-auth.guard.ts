import { ExecutionContext, Injectable, Logger, Optional, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh-jwt') {
  private readonly logger = new Logger(RefreshAuthGuard.name);

  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<FastifyRequest>();

    const token = req.headers?.authorization?.split(' ')[1];
    this.logger.debug(`[Debug Token] Token received: ${token}`);

    this.logger.warn(
      `[RefreshAuthGuard] Triggered! AuthHeader: ${!!req.headers?.authorization}, Cookies: ${JSON.stringify(req.cookies)}`,
    );

  const rawToken = req.headers?.authorization?.split(' ')[1];
  
  if (rawToken) {
    const payload = JSON.parse(Buffer.from(rawToken.split('.')[1], 'base64').toString());
    this.logger.warn(
      `[Token Inspector] Token snippet: ${rawToken.slice(-10)} | TTL (seconds): ${payload.exp - payload.iat}`,
    );
  }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error(
        `[RefreshAuthGuard] Rejected -> err: ${err?.message} | reason: ${info?.message || info}`,
      );
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
