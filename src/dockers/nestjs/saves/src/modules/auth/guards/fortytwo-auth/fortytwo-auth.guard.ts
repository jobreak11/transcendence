import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';

@Injectable()
export class FortytwoAuthGuard extends AuthGuard('fortyTwo') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }

  getResponse(context: ExecutionContext) {
    const res = context.switchToHttp().getResponse<FastifyReply>();
    return res.raw ?? res;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<FastifyRequest<{Querystring: { callbackUrl?: string }}>>();

    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || "https";

    const callbackPath = process.env.OAUTH_42_CALLBACK_PATH || '/api/auth/42/callback';
    const dynamicCallbackURL = `${proto}://${host}${callbackPath}`;


    if ((req.query as Record<string,unknown>)?.code) {
      return {
        callbackURL: dynamicCallbackURL
      }
    }

    const rawCallbackUrl = req.query?.callbackUrl;
    const isValidRelative =
      typeof rawCallbackUrl === 'string' &&
      rawCallbackUrl.startsWith('/') &&
      !rawCallbackUrl.startsWith('//');
    
    const targetURL = isValidRelative ? rawCallbackUrl : '/';

    return {
      state: encodeURIComponent(targetURL),
      callbackURL: dynamicCallbackURL
    }
  }
}