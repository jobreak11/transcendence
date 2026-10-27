import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRedisService } from '../../redis/user-redis/user-redis.service.js';


// This guard must be only after performing the jwtAuthGuard
@Injectable()
export class LobbyGuard implements CanActivate {
  constructor(
    private readonly userRedisService: UserRedisService
  ) {}

  canActivate(
    context: ExecutionContext,
  ) {

    const req = context.switchToHttp().getRequest();

    return this.userRedisService.isUserOnline(req.user.id);
  }
}
