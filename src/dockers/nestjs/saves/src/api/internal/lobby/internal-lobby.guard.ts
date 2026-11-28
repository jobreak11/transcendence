import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { UsersRedisService } from "../../../modules/user/redis/users-redis.service.js";


// This guard must be only after performing the jwtAuthGuard
@Injectable()
export class InternalLobbyGuard implements CanActivate {
  constructor(
    private readonly userRedisService: UsersRedisService
  ) {}

  canActivate(
    context: ExecutionContext,
  ) {

    const req = context.switchToHttp().getRequest();

    return this.userRedisService.isUserOnline(req.user.id);
  }
}