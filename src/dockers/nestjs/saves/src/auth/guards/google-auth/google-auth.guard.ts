import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthGuardAuthenticateOptions, AuthModuleOptions } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { FastifyReply } from 'fastify'; 

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }

  getResponse(context: ExecutionContext) {
    const res = context.switchToHttp().getResponse<FastifyReply>();
    return res.raw ?? res;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const rawCallbackUrl = req.query?.callbackUrl;
    const isValidRelative =
      typeof rawCallbackUrl === 'string' &&
      rawCallbackUrl.startsWith('/') &&
      !rawCallbackUrl.startsWith('//');

    
    const targetURL = isValidRelative ? rawCallbackUrl : '/';

    console.log({message: 'GoogleAuthGuardChecking', state: encodeURIComponent(targetURL)});

    return {
      state: encodeURIComponent(targetURL)
    }
  }
}
