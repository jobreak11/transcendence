import { Inject, Injectable, Logger } from "@nestjs/common";
import { WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { REDIS_CLIENT } from "../../../redis/redis.provider.js";
import type { RedisClient } from "../../../redis/redis.provider.js";
import { UserRedisService } from "../../../redis/user-redis/user-redis.service.js";
import { room_main_private_user } from "../rooms/user.room.js";


@Injectable()
export class ConnectionGatewayService {

  private readonly logger = new Logger(ConnectionGatewayService.name);

  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  constructor(
    private readonly userRedisService: UserRedisService,
  ) {
  }

  async addClientId(clientId: string, userId: string) {
    const res = await this.userRedisService.addMainClientSocketList(userId, clientId);

    if (res) {
      this.server?.in(res[0]).socketsLeave(room_main_private_user(userId));
      this.server?.in(res[0]).disconnectSockets(true);
      this.logger.log(`connection dropped: Client id maxed out per user ${userId}: clientId to remove: ${res[0]}`)
      await this.userRedisService.removeMainClientSocket(userId, res[0]);

    }
    return ;
  }

  removeClientId(clientId: string, userId: string) {
    this.server?.in(clientId).socketsLeave(room_main_private_user(userId));
    return this.userRedisService.removeMainClientSocket(userId, clientId);
  }

  //async setUserIsOnline(userId: string, isOnline: boolean) {
  //  if (isOnline === true)  {
  //    await this.re
  //    await this.redis.set(redis_user_is_online(userId), "true")
  //  }
  //  else {
  //    await this.redis.del(redis_user_is_online(userId));
  //  }
  //}

  //async isUserOnline(userId: string): Promise<boolean> {

  //  const res = await this.redis.get(redis_user_is_online(userId));

  //  if (res) {
  //    return true;
  //  }
  //  return false;
  //}
}