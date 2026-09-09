import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class FortytwoAuthGuard extends AuthGuard('fortyTwo') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }
}