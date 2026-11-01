import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConnectionGatewayService } from '../../websocket/main-gateway/connection-gateway/connection-gateway.service.js';


// This guard must be only after performing the jwtAuthGuard
@Injectable()
export class LobbyGuard implements CanActivate {
  constructor(
    private readonly connectionGatewayService: ConnectionGatewayService
  ) {}

  canActivate(
    context: ExecutionContext,
  ) {

    const req = context.switchToHttp().getRequest();

    return this.connectionGatewayService.isUserOnline(req.user.id);
  }
}
