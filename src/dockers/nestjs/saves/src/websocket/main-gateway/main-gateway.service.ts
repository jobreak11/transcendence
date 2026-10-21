import { Inject, Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";
import { REDIS_CLIENT } from "../../redis/redis.provider.js";
import type { RedisClient } from "../../redis/redis.provider.js";
import { redis_user_is_online } from "../../redis/user-redis/namespaces/user.namespace.js";
import { redis_cache_user_tag_id } from "../../redis/namespaces/caching/cache-user.namespace.js";


@Injectable()
export class MainGatewayService {

  private readonly logger = new Logger(MainGatewayService.name);

  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

}