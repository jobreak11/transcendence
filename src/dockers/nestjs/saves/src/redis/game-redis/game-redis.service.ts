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

  generateGameRoomId() {
    return uuidv7();
  }

  // assuming already checked the ready state of the lobby room
  async gameRoomCreate(lobbyPayload: {
    lobbyData: Lobby.FullDto,
    lobbyMemberList: GetLobbyMemberListDto
  }) {

    // must be in unvailable state first for the lobby
    if (lobbyPayload.lobbyData.details.roomStatus !== LobbyRoomStatus.UNAVAILABLE) {
      throw logError(
        this.logger,
        "error from gameRoomCreate()",
        "lobby room must be in the unavailable state to start the game",
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    if (lobbyPayload.lobbyData.details.gameRoomId !== null) {
      throw errorWithCode(
        HttpStatus.CONFLICT,
        "this lobby room already have a game room"
      )
    }

    let newGameRoomId: string = "";
    let returnRes: number = 0;
    let addNewGameRoomRes: boolean = false;
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      newGameRoomId = this.generateGameRoomId();
      returnRes = await this.redis.setWithLimitAdd(
        redis_game_all_rooms(),
        newGameRoomId,
        GAME_ROOM_MAX
      );

      if (returnRes !== 2) {

        break ;
      }
    }

    if (returnRes !== 0) {
      if (returnRes === 1) {
        throw errorWithCode(
          HttpStatus.SERVICE_UNAVAILABLE,
          "game room global limit is full, try again later"
        )

      }
      else if (returnRes === 2) {
        throw logError(
          this.logger,
          "error from gameRoomCreate()",
          "cannot insert new game room with the given amount of retries",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      } else {
        throw logError(
          this.logger,
          "error from gameRoomCreate()",
          "res return from ioredis define command invalid",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    // insert game room id into user namespace
    const allPlayerPromises = lobbyPayload.lobbyMemberList.playerList.map((userId) => {
      return this.userRedisService.addNewGameRoom(userId, newGameRoomId)
    })
    const allSpectatorPromises = lobbyPayload.lobbyMemberList.spectatorList.map((userId) => {
      return this.userRedisService.addNewGameRoom(userId, newGameRoomId)
    })

    await Promise.all([
      ...allPlayerPromises,
      ...allSpectatorPromises
    ])


    // Contruct the initial game room data here



    

    return {
      gameRoomId: newGameRoomId
    }
  }

}