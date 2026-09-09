import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }
}
