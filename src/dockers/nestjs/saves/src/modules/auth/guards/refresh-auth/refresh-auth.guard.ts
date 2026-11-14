import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh-jwt') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options)
  }
}
