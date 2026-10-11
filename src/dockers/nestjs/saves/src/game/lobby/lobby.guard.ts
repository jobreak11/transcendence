import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MainGatewayService } from '../../mainGateway/mainGateway.service.js';


// This guard must be only after performing the jwtAuthGuard
@Injectable()
export class LobbyGuard implements CanActivate {
  constructor(
    private readonly mainGatewayService: MainGatewayService
  ) {}

  canActivate(
    context: ExecutionContext,
  ) {

    const req = context.switchToHttp().getRequest();

    return this.mainGatewayService.isUserOnline(req.user.id);
  }
}
