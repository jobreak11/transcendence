import { ExecutionContext, Injectable, Logger, Optional, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh-jwt') {
  private readonly logger = new Logger(RefreshAuthGuard.name);

  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    this.logger.warn(
      `[RefreshAuthGuard] Triggered! AuthHeader: ${!!req.headers?.authorization}, Cookies: ${JSON.stringify(req.cookies)}`,
    );
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
