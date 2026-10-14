import { Inject, Injectable, Logger } from "@nestjs/common";
import { WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { REDIS_CLIENT } from "../../../redis/redis.provider.js";
import type { RedisClient } from "../../../redis/redis.provider.js";
import { redis_user_is_online } from "../../../redis/namespaces/user/user.namespace.js";


@Injectable()
export class ConnectionGatewayService {

  private readonly logger = new Logger(ConnectionGatewayService.name);

  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {
  }

  async setUserIsOnline(userId: string, isOnline: boolean) {
    if (isOnline === true)  {
      await this.redis.set(redis_user_is_online(userId), "true")
    }
    else {
      await this.redis.del(redis_user_is_online(userId));
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {

    const res = await this.redis.get(redis_user_is_online(userId));

    if (res) {
      return true;
    }
    return false;
  }
}