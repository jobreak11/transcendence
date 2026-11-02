import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { REDIS_CLIENT } from "../redis.provider.js";
import type { RedisClient } from "../redis.provider.js";
import { Lobby } from "../lobby-redis/schemas/lobby.redis.schema.js";
import { GetLobbyMemberListDto } from "../../game/lobby/dto/get-lobby-member-list.dto.js";
import { UserRedisService } from "../user-redis/user-redis.service.js";
import { LobbyRoomStatus } from "../lobby-redis/schemas/lobby-details.redis.schema.js";
import { logError } from "../../utility/logError.js";
import { errorWithCode } from "../../utility/errorWithCode.js";
import { v7 as uuidv7 } from "uuid"
import { redis_game_all_rooms } from "./namespaces/game-redis.namespace.js";
import { GAME_ROOM_MAX } from "./game-redis.constants.js";

@Injectable()
export class GameRedisService {

  private readonly logger = new Logger(GameRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly userRedisService: UserRedisService,
  ) {

  }


}