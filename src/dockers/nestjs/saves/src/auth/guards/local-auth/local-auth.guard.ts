import { Injectable, Optional, Options } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('main-login') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options)
  }
}
