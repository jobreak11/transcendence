import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class FortytwoAuthGuard extends AuthGuard('fortyTwo') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const rawCallbackUrl = req.query.callbackUrl;
    const isValidRelative =
      typeof rawCallbackUrl === 'string' &&
      rawCallbackUrl.startsWith('/') &&
      !rawCallbackUrl.startsWith('//');
    
    const targetURL = isValidRelative ? rawCallbackUrl : '/';

    return {
      state: encodeURIComponent(targetURL)
    }
  }
}