import { Inject, Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";
import type { RedisClient } from "../../redis/redis.provider.js";
import { REDIS_CLIENT } from "../../redis/redis.provider.js";


@Injectable()
export class GameGatewayService {

  private readonly logger = new Logger(GameGatewayService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient
  ) {

  }
}