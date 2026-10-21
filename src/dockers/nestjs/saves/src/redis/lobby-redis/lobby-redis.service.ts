import { HttpCode, HttpStatus, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { REDIS_CLIENT } from "../redis.provider.js";
import type { RedisClient } from "../redis.provider.js";
import z, { keyof, record } from "zod";
import { redis_lobby_details, redis_lobby_game_settings, redis_lobby_general_settings, redis_lobby_global_details_lobby_lists, redis_lobby_player_member_list, redis_lobby_ready_player_list, redis_lobby_spectator_member_list } from "./namespaces/lobby.namespace.js";
import { LOBBY_ROOM_MAX } from "../../game/lobby/lobby.constants.js";
import * as crypto from 'node:crypto'
import { LobbyRoomStatus } from "./schemas/lobby-details.redis.schema.js";
import { GameSettingFormat, GameSettings } from "./schemas/lobby-gameSettings.redis.schema.js";
import { GameSettingsDto } from "../../game/lobby/dto/game-settings.dto.js";
import { LobbyCreate } from "./schemas/lobby-create.redis.schema.js";
import { Lobby } from "./schemas/lobby.redis.schema.js";
import { LobbyRecordsDto } from "./dtos/lobby-records.dto.js";
import { LobbyRoomType } from "./schemas/lobby-generalSettings.redis.schema.js";
import { read } from "node:fs";

@Injectable()
export class LobbyRedisService implements OnModuleInit {

  private readonly logger = new Logger(LobbyRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {

  }

  async onModuleInit() {
    await this.redis.defineCommand('lobbyRoomCreate', {
      numberOfKeys: 2,
      readOnly: false,
      lua: `
        local userGameLobbyKey = KEYS[1]
        local allLobbyListsKey = KEYS[2]


        local lobbyRoomMax = tonumber(ARGV[1])
        local newLobbyPinId = ARGV[2]

        if redis.call('EXISTS', userGameLobbyKey) ~= 0 then
          return 1
        end

        if redis.call('SCARD', allLobbyListsKey) >= lobbyRoomMax then
          return 2
        end

        if redis.call('SADD', allLobbyListsKey, newLobbyPinId) ~= 1 then
          return 3
        end

        return 0
      `
    })

    await this.redis.defineCommand("lobbyJoin", {
      numberOfKeys: 2,
      readOnly: false,
      lua: `

      
      `

    })

// #########################################################################

    await this.redis.defineCommand("lobbyRoomJoin", {
      numberOfKeys: 6,
      readOnly: false,
      lua: `
        local userGameLobbyKey = KEYS[1]
        local allLobbyListsKey = KEYS[2]
        local spectatorMemberListKey = KEYS[3]
        local playerMemberListKey = KEYS[4]
        local lobbyGameSettingsKey = KEYS[5]
        local lobbyGeneralSettingsKey = KEYS[6]

        local isSpectator = ARGV[1]
        local joinUserId = ARGV[2]
        local password = ARGV[3]
        local lobbyPinId = ARGV[4]
        local joinedAt = tonumber(ARGV[5])

        -- This key mean is user already in a lobby they should not be able to join any
        if redis.call('EXISTS', userGameLobbyKey) ~= 0 then
          return 1
        end

        -- check if the target lobby exist
        if redis.call('SISMEMBER', allLobbyListsKey, lobbyPinId) == 0 then
          return 5
        end

        -- check if the target lobby current status is allowed to join
        local currentLobbyStatus = redis.call('HGET', lobbyGeneralSettingsKey, 'roomStatus')
        if currentLobbyStatus == 'UNAVAILABLE' then
          return 6
        elseif isSpectator == "false" and currentLobbyStatus ~= 'WAITING' then
          return 7
        end

        local lobbyPassword = redis.call('HGET', lobbyGeneralSettingsKey, 'password')
        if lobbyPassword then
          if password ~= lobbyPassword then
           return 4
          end
        end

        if isSpectator == "true" then

          local currentSpectatorCount = redis.call('ZCARD', spectatorMemberListKey)
          local maxSpectator = tonumber(redis.call('HGET', lobbyGameSettingsKey, 'maxSpectator') or 0)

          if currentSpectatorCount >= maxSpectator then
            return 3
          end

          if redis.call('ZADD', spectatorMemberListKey, joinedAt, joinUserId) ~= 1 then
            return 2
          end


        else
          local currentPlayerCount = redis.call('ZCARD', playerMemberListKey)
          local maxPlayer = tonumber(redis.call('HGET', lobbyGameSettingsKey, 'maxPlayer') or 0)

          if currentPlayerCount >= maxPlayer then
            return 3
          end


          if redis.call('ZADD', playerMemberListKey, joinedAt, joinUserId) ~= 1 then
            return 2
          end

        end

        redis.call('SET', userGameLobbyKey, lobbyPinId)

        return 0
      `
    });


    await this.redis.defineCommand("lobbyRoomLeave", {
      numberOfKeys: 6,
      readOnly: false,
      lua: `
        local playerMemberListKey = KEYS[1]
        local spectatorMemberListKey = KEYS[2]
        local allLobbyListKey = KEYS[3]
        local userGameLobbyKey = KEYS[4]
        local generalSettingsKey = KEYS[5]
        local gameSettingsKey = KEYS[6]

        local leaveUserId = ARGV[1]
        local lobbyPinId = ARGV[2]

        if redis.call("GET", userGameLobbyKey) ~= lobbyPinId then
          return 3
        end

        if redis.call("SISMEMBER", allLobbyListKey, lobbyPinId) == 0 then
          return 1
        end

        local isUserHost
        local hostUserId = redis.call('HGET', generalSettingsKey, 'hostUserId');

        if hostUserId and hostUserId == leaveUserId then
          isUserHost = 1
        else
          isUserHost = 0
        end

        if redis.call('ZREM', playerMemberListKey, leaveUserId) == 0 then
          if redis.call('ZREM', spectatorMemberListKey, leaveUserId) == 0 then
            return 2
          end
        end

        -- also remove the current user in game lobby
        redis.call('UNLINK', userGameLobbyKey)

        -- get current member in lobby
        local curPCount = tonumber(redis.call('ZCARD', playerMemberListKey))
        local curSCount = tonumber(redis.call('ZCARD', spectatorMemberListKey))

        -- will destroy the lobby room if the room is empty
        if curPCount <= 0 and curSCount <= 0 then
          -- remove all related keys
          redis.call('UNLINK', generalSettingsKey, gameSettingsKey, playerMemberListKey, spectatorMemberListKey)
          redis.call('SREM', allLobbyListKey, lobbyPinId)

          return 4
        end

        -- if the user that out from the room is the host, transfer the host to
        -- the oldest member in the lobby room
        if isUserHost == 1 then
          local oldestPlayerMember = redis.call('ZRANGE', playerMemberListKey, 0, 0, 'WITHSCORES')

          local oldestSpectatorMember = redis.call('ZRANGE', spectatorMemberListKey, 0, 0, 'WITHSCORES')

          if oldestPlayerMember[1] and oldestSpectatorMember[1] then
            local playerTimestamp = tonumber(oldestPlayerMember[1])
            local spectatorTimestamp = tonumber(oldestSpectatorMember[1])
            if playerTimestamp <= spectatorTimestamp then
              redis.call('HSET', generalSettingsKey, 'hostUserId', oldestPlayerMember[1])
            else
              redis.call('HSET', generalSettingsKey, 'hostUserId', oldestSpectatorMember[1])
            end
          elseif oldestPlayerMember[1] then
            redis.call('HSET', generalSettingsKey, 'hostUserId', oldestPlayerMember[1])
          elseif oldestSpectatorMember[1] then
            redis.call('HSET', generalSettingsKey, 'hostUserId', oldestSpectatorMember[1])
          end
        end

        return 0
      `
    });

    await this.redis.defineCommand('lobbyRoomSetStatus',
      {
        numberOfKeys: 2,
        readOnly: false,
        lua: `
          local allLobbyListKey = KEYS[1]
          local generalSettingsKey = KEYS[2]

          local lobbyPinId = ARGV[1]
          local setStatus = ARGV[2]

          -- check first if the lobby is exist
          if tonumber(redis.call('SISMEMBER', allLobbyListKey, lobbyPinId)) == 0 then
            return 1
          end

          -- lobby exist then should set

          local currentStatus = redis.call('HGET', generalSettingsKey, 'roomStatus')

          if not currentStatus or currentStatus == setStatus then
            return 2
          end

          redis.call('HSET', generalSettingsKey, 'roomStatus', setStatus)
          return 0
        `
      }
    );
    
  }

  generateNewLobbyPinId(): string {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');

  }

  private lobbyToRecord(fullLobbyDto: Lobby.FullDto): LobbyRecordsDto {

    const detailsRecord = Object.fromEntries(
      Object.entries(fullLobbyDto.details)
      .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : String(value ?? "")])
    )
    const generalSettingsRecord = Object.fromEntries(
      Object.entries(fullLobbyDto.generalSettings)
      .map(([key, value]) => [key, String(value ?? "")])
    )
    const gameSettingsRecord = Object.fromEntries(
      Object.entries(fullLobbyDto.gameSettings)
      .map(([key, value]) => [key, String(value ?? "")])
    )

    return {
      lobbyDetails: detailsRecord,
      generalSettings: generalSettingsRecord,
      gameSettings: gameSettingsRecord
    }
  }

  private recordToLobby(records: LobbyRecordsDto): Lobby.FullDto {


    return {
      details: {
        createdAt: new Date(records.lobbyDetails.createdAt),
        createdByUserId: records.lobbyDetails.createdByUserId,
        hostUserId: records.lobbyDetails.hostUserId,
        roomPinId: records.lobbyDetails.roomPinId,
        roomStatus: records.lobbyDetails.roomStatus as LobbyRoomStatus,
        currentPlayerCount: parseInt(records.lobbyDetails.currentPlayerCount),
        currentSpectatorCount: parseInt(records.lobbyDetails.currentSpectatorCount)
      },
      gameSettings: {
        maxPlayer: parseInt(records.gameSettings.maxPlayer),
        maxSpectator: parseInt(records.gameSettings.maxSpectator),
        format: records.gameSettings.format as GameSettingFormat,
        startingChips: parseInt(records.gameSettings.startingChips),
        bigBlind: parseInt(records.gameSettings.bigBlind),
        ante: records.gameSettings.ante ? parseInt(records.gameSettings.ante) : null ,
      },
      generalSettings: {
        catchPhrase: records.generalSettings.catchPhrase ? records.generalSettings.catchPhrase : null,
        password: records.generalSettings.password ? records.generalSettings.password : null,
        roomType: records.generalSettings.roomType as LobbyRoomType
      }
    }
  }

  async lobbyCreate(lobbyCreateDto: LobbyCreate.InputDto) {

    const inputPayload = LobbyCreate.schema.input.safeParse(lobbyCreateDto);

    if (!inputPayload.success) {
      throw new Error("payload validation failed", {
        cause: {
          code : HttpStatus.BAD_REQUEST,
          message: "payload validation failed",
          errors: z.treeifyError(inputPayload.error)
        }
      })
    }

    let redisReturnValue = 0;
    let newLobbyPinId: string = "";
    const retriesLimit = 10;
    for (let i = 0; i < retriesLimit; i++) {
      newLobbyPinId = this.generateNewLobbyPinId();
      redisReturnValue = await this.redis.lobbyRoomCreate(
        redis_user_game_lobby(inputPayload.data.details.createdByUserId),
        redis_lobby_global_details_lobby_lists(),
        LOBBY_ROOM_MAX,
        newLobbyPinId
      )

      if (redisReturnValue !== 3) {
        // if the return code if not 3 then no need to retries
        break ;
      }
    }

    if (redisReturnValue !== 0) {
      if (redisReturnValue === 1) {
        // 1 means the user is already in a lobby room
        // if already in lobby should not allowed to create new lobby
        throw new Error("user already in a lobby, cannot create new room", {
          cause: {
            code: HttpStatus.FORBIDDEN,
            message: "user already in a lobby, cannot create new room"
          }
        })
      }
      else if (redisReturnValue === 2) {
        throw new Error("", {
          cause: {
            code: HttpStatus.SERVICE_UNAVAILABLE,
            message: "the lobby is full and cannot insert any more room"
          }
        })
      }
      else {

        this.logger.error({
          message: "error from lobbyCreate()" ,
          error: "cannot insert the room withing the given loop"
        });

        throw new Error("", {
          cause: {
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "cannot insert the room within the amout of retires"
          }
        })

      }
    }

    const lobbyDto: z.input<typeof Lobby.schema.insert> = {
      generalSettings: inputPayload.data.generalSettings,
      details: {
        ...inputPayload.data.details,
        roomPinId: newLobbyPinId,
        currentPlayerCount: 1,
        currentSpectatorCount: 0
      },
      gameSettings: inputPayload.data.gameSettings
    }

    const lobbyPayload = Lobby.schema.insert.safeParse(lobbyDto);

    if (!lobbyPayload.success) {

      const errorObj = z.treeifyError(lobbyPayload.error);

      this.logger.error({
        message: "error from Lobby Create",
        error: errorObj
      });
      
      throw new Error("lobby payload invalid", {
        cause: {
          message: "lobby payload invalid",
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          errors: errorObj
        }
      })
    }

    const fullLobbyPayload: z.infer<typeof Lobby.schema.full> = {
      details: lobbyPayload.data.details,
      gameSettings: lobbyPayload.data.gameSettings,
      generalSettings: lobbyPayload.data.generalSettings
    }

    const records = this.lobbyToRecord(fullLobbyPayload);

    const allRes = await this.redis
      .pipeline()
      .hset(
        redis_lobby_general_settings(newLobbyPinId),
        records.generalSettings
      )
      .hset(
        redis_lobby_game_settings(newLobbyPinId), 
        records.gameSettings
      )
      .hset(
        redis_lobby_details(newLobbyPinId), 
        records.gameSettings
      )
      .zadd(
        redis_lobby_player_member_list(newLobbyPinId),
        new Date().getTime(),
      )
      .set(
        redis_user_game_lobby(fullLobbyPayload.details.createdByUserId),
        newLobbyPinId
      )
      .exec();

    if (!allRes) {
      // 
      this.logger.error({
        message: "from createLobby()",
        error: "redis pipeline error",
      });

      throw new Error("redis pipeline failed", {
        cause: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "redis pipeline failed"
        }
      });
    }

    return fullLobbyPayload;
  }

  async getLobbyMemberList(lobbyPinId: string) {
    const res = await this.redis.pipeline()
      .sismember(redis_lobby_global_details_lobby_lists(), lobbyPinId)
      .zrange(redis_lobby_player_member_list(lobbyPinId), 0, "-1")
      .zrange(redis_lobby_spectator_member_list(lobbyPinId), 0, "-1")
      .smembers(redis_lobby_ready_player_list(lobbyPinId))
      .exec()

    if (!res) {
      throw new Error("lobby redis pipeline error", {
        cause: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "redis pipeline error from getLobbyMemberlist()"
        }
      })
    }

    const errObj: Error[] = [];
    for (const [err] of res) {

      if (err) {
        this.logger.error({
          message: "redis error frmo getLobbyMemberList",
          error: err
        })
        errObj.push(err);
      }
    }

    if (errObj.length !== 0) {
      throw new Error("redis pipeline error", {
        cause: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "pipeline complete but error",
          errors: errObj
        }
      })
    }

    const [
      [, isLobbyExist],
      [, playerMemberList],
      [, spectatorMemberList],
      [, readyPlayerList]
    ] = res as [
      [Error | null, number],
      [Error | null, string[]],
      [Error | null, string[]],
      [Error | null, string[]],
    ]

    if (isLobbyExist === 0) {
      // throw error out if the lobby doesn't exist
      throw new Error("the lobby doesn't exist", {
        cause: {
          code: HttpStatus.NOT_FOUND,
          message: "lobby doesn't exist to retreive the data"
        }
      })
    }

    return {
      playerList: playerMemberList,
      spectatorList: spectatorMemberList,
      readyPlayerList: readyPlayerList
    }

  }

  getPlayerMemberList(lobbyPinId: string) {
    return this.redis
      .zrange(redis_lobby_player_member_list(lobbyPinId), 0, "-1")
  }

  getSpectatorMemberList(lobbyPinId: string) {
    return this.redis
    .zrange(redis_lobby_spectator_member_list(lobbyPinId), 0, "-1")
  }

  getReadyPlayerList(lobbyPinId: string) {
    return this.redis
    .smembers(redis_lobby_ready_player_list(lobbyPinId));
  }


  async getLobbyFull(lobbyPinId: string): Promise<Lobby.FullDto> {

    const allRes = await this.redis.pipeline()
      .hgetall(redis_lobby_details(lobbyPinId))
      .hgetall(redis_lobby_general_settings(lobbyPinId))
      .hgetall(redis_lobby_game_settings(lobbyPinId))
      .exec()

    if (!allRes) {
      throw new Error("redis pipeline Error", {
        cause: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "redis pipeline error",
        }
      })
    }

    const errObj: Error[] = [];
    for (const [err] of allRes) {
      if (err) {
        errObj.push(err);
      }

    }

    if (errObj.length !== 0) {
      this.logger.error({
        message: "getLobbyFull() pipeline success but element error",
        errors: errObj
      });
      throw new Error("redis pipeline success but element error", {
        cause: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "error from getLobbyFull()",
          errors: errObj
        }
      });
    }

    const [
      [, details],
      [, generalSettings],
      [, gameSettings]
    ] = allRes as [
      [Error | null, Record<string,string>],
      [Error | null, Record<string,string>],
      [Error | null, Record<string,string>],
    ]

    return this.recordToLobby({
      lobbyDetails: details,
      gameSettings: gameSettings,
      generalSettings: generalSettings
    })
  }



  // ready toggle state, just flip
  // true means ready and false mean not ready
  async lobbyUserReadyState(userId: string) {
    
    // check from redis that the user is in what lobby

    const lobbyRoomId = await this.redis.get(redis_user_game_lobby(userId));

    if (!lobbyRoomId) {
      throw new NotFoundException("user if not in lobby room");
    }

    const lobbyData = await this.getLobbyFull(lobbyRoomId);

    // 1. the lobby must be in WAITING state for user to press ready button
    if (lobbyData.details.roomStatus !== LobbyRoomStatus.WAITING) {
      throw new Error("lobby must be in waiting state to press ready", {
        cause: {
          code: HttpStatus.FORBIDDEN,
          message: "lobby must be in waiting state to perform action"
        }
      })
    }

    // 2. user must be player and not spectator to be able to press ready button
    const lobbyMemberList = await this.getPlayerMemberList(lobbyRoomId);

    if (lobbyMemberList.includes(userId) !== true)  {
      throw new Error("only player can press ready button", {
        cause: {
          code: HttpStatus.FORBIDDEN,
          message: "only player in the lobby can perform this action while in waiting state"
        }
      })
    }

    // 3. host user Id doesn't need to press ready button
    if (userId === lobbyData.details.hostUserId) {
      throw new Error("Host can start game, but cannot press ready button", {
        cause: {
          code: HttpStatus.FORBIDDEN,
          message: "Host can start game, but cannot press ready button"
        }
      })
    }

    const readyPlayerList = await this.getReadyPlayerList(lobbyRoomId);

    if (readyPlayerList.includes(userId)) {
      await this.redis.srem(redis_lobby_ready_player_list(lobbyRoomId), userId);
      return false;
    }
    else {
      await this.redis.sadd(redis_lobby_ready_player_list(lobbyRoomId), userId);
      return true;
    }
  }

  async startGameRoom(userId: string) {

    // NOTE: must perform as atomic on lua script on redis

    // 1. retrieve the lobby data from redis
    //

    // checks
    // 1. check if the lobby is on WAITNG state
    // 2. check that all player user in the room is ready

    // then
    // 1. create payload data ready for create game room
    // 2. instantiate game room initial data on redis using that payload
    // 3. change the state of the lobby room to PLAYING
    // 4. change the state of the user in redis data into playing game.
    //    so that we can implement to the user service which would return the current state
    //    of the user that is it currently in a game and can redirect directly to game room
    //    and continue to be in game room whether the user is spectator or player


    // NOTE: the poker game room will not start if any of players are not once connect into
    //        the game yet. or the time need to pass the waiting connection time then the game
    //        will start anyway and do not wait any unconnected player
  
  }

  async isLobbyExist(lobbyPinId: string) {
    const res = await this.redis.sismember(redis_lobby_global_details_lobby_lists(), lobbyPinId);
    if (res === 0) {
      return false;
    }
    return true;
  }


}