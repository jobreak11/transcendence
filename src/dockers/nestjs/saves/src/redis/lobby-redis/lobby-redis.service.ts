import { BadRequestException, HttpCode, HttpStatus, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { REDIS_CLIENT } from "../redis.provider.js";
import type { RedisClient } from "../redis.provider.js";
import z, { keyof, record } from "zod";
import { redis_lobby_all_keys, redis_lobby_details, redis_lobby_game_settings, redis_lobby_general_settings, redis_lobby_global_details_lobby_lists, redis_lobby_player_member_list, redis_lobby_ready_player_list, redis_lobby_spectator_member_list } from "./namespaces/lobby.namespace.js";
import { LOBBY_ROOM_MAX } from "../../game/lobby/lobby.constants.js";
import * as crypto from 'node:crypto'
import { LobbyRoomStatus } from "./schemas/lobby-details.redis.schema.js";
import { GameSettingFormat, GameSettings, LobbyGameSettings } from "./schemas/lobby-gameSettings.redis.schema.js";
import { LobbyCreate } from "./schemas/lobby-create.redis.schema.js";
import { Lobby } from "./schemas/lobby.redis.schema.js";
import { LobbyRecordsDto } from "./dtos/lobby-records.dto.js";
import { LobbyRoomType } from "./schemas/lobby-generalSettings.redis.schema.js";
import { errorWithCode } from "../../utility/errorWithCode.js";
import { UserRedisService } from "../user-redis/user-redis.service.js";
import { redis_user_lobby_list } from "../user-redis/namespaces/user.namespace.js";
import { ChatService } from "../../chat/chat.service.js";
import { ChatRoomVisibilityType } from "../../drizzle/schema/chat_rooms/chat_rooms.schema.js";
import { REDIS_USER_LOBBY_LIST_LIMIT } from "../user-redis/user-redis.constants.js";
import { logError } from "../../utility/logError.js";
import { logErrorRedisError, logErrorRedisPipeLine } from "../utility/redis-logError.js";
import { lobbyUpdateSchema } from "./schemas/lobby-update.redis.schema.js";
import { parse } from "node:path";
import { GameRedisService } from "../game-redis/game-redis.service.js";

@Injectable()
export class LobbyRedisService implements OnModuleInit {

  private readonly logger = new Logger(LobbyRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly userRedisService: UserRedisService,
    private readonly chatService: ChatService,
    private readonly gameRedisService: GameRedisService
  ) {

  }

  async onModuleInit() {
    //await this.redis.defineCommand('lobbyRoomCreate', {
    //  numberOfKeys: 1,
    //  readOnly: false,
    //  lua: `
    //    local allLobbyListsKey = KEYS[1]


    //    local lobbyRoomMax = tonumber(ARGV[1])
    //    local newLobbyPinId = ARGV[2]

    //    if redis.call('SCARD', allLobbyListsKey) >= lobbyRoomMax then
    //      return 1
    //    end

    //    if redis.call('SADD', allLobbyListsKey, newLobbyPinId) ~= 1 then
    //      return 2
    //    end

    //    return 0
    //  `
    //})

// #########################################################################

    await this.redis.defineCommand("lobbyRoomJoin", {
      numberOfKeys: 6,
      readOnly: false,
      lua: `
        local userLobbyListKeys = KEYS[1]
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
        local userLobbyListLimit = tonumber(ARGV[6])

        -- check first if the targeted user already max the lobby
        if redis.call('SCARD', userLobbyListKey) >= userLobbyListLimit then
          return 1
        end

        -- check if user already in this lobby
        if redis.call('SISMEMBER', userLobbyListKey, lobbyPinId) ~= 0 then
          return 2
        end


        -- check if the target lobby exist
        if redis.call('SISMEMBER', allLobbyListsKey, lobbyPinId) == 0 then
          return 3
        end

        -- check if the target lobby current status is allowed to join
        local currentLobbyStatus = redis.call('HGET', lobbyGeneralSettingsKey, 'roomStatus')
        if currentLobbyStatus == 'UNAVAILABLE' then
          return 4
        elseif isSpectator == "false" and currentLobbyStatus ~= 'WAITING' then
          return 5
        end

        local lobbyPassword = redis.call('HGET', lobbyGeneralSettingsKey, 'password')
        if lobbyPassword then
          if password ~= lobbyPassword then
           return 6
          end
        end

        if isSpectator == "true" then

          local currentSpectatorCount = redis.call('ZCARD', spectatorMemberListKey)
          local maxSpectator = tonumber(redis.call('HGET', lobbyGameSettingsKey, 'maxSpectator') or 0)

          if currentSpectatorCount >= maxSpectator then
            return 7
          end

          if redis.call('ZADD', spectatorMemberListKey, joinedAt, joinUserId) ~= 1 then
            return 8
          end


        else
          local currentPlayerCount = redis.call('ZCARD', playerMemberListKey)
          local maxPlayer = tonumber(redis.call('HGET', lobbyGameSettingsKey, 'maxPlayer') or 0)

          if currentPlayerCount >= maxPlayer then
            return 7
          end


          if redis.call('ZADD', playerMemberListKey, joinedAt, joinUserId) ~= 1 then
            return 8
          end

        end

        redis.call('SADD', userLobbyListKey, lobbyPinId)

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
        local userLobbyListKey = KEYS[4]
        local generalSettingsKey = KEYS[5]
        local gameSettingsKey = KEYS[6]

        local leaveUserId = ARGV[1]
        local lobbyPinId = ARGV[2]

        if redis.call('SISMEMBER', userLobbyListKey, lobbyPinId) == 0 then
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
        redis.call('SREM', userLobbyListKey, lobbyPinId);

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
        chatRoomId: records.lobbyDetails.chatRoomId,
        gameRoomId: records.lobbyDetails.gameRoomId ? records.lobbyDetails.gameRoomId : null,
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

  async lobbyRemove(lobbyPinId: string) {

    const [
      lobbyMemberList,
      lobbyData,
    ] = await Promise.all([
      this.getLobbyMemberList(lobbyPinId),
      this.getLobbyFull(lobbyPinId)
    ]);

    const promisePlayer = lobbyMemberList.playerList.map((value) => {
      return this.lobbyUserLeave(value, lobbyPinId).catch(() => null);
    })

    const promiseSpectator = lobbyMemberList.spectatorList.map((value) => {
      return this.lobbyUserLeave(value, lobbyPinId).catch(() => null);
    });

    const combined = [...promisePlayer, ...promiseSpectator];

    await Promise.all(combined);

    const res = await this.redis
      .pipeline()
      .srem(
        redis_lobby_global_details_lobby_lists(),
        lobbyPinId
      )
      .del(
        redis_lobby_all_keys(lobbyPinId)
      )
      .exec();

    if (!res) {
      throw logErrorRedisPipeLine(
        this.logger,
        "lobbyRemove()"
      );
    }

    const errObj: Error[] = [];
    for (const [err] of res) {
      if (err) {
        errObj.push(err);
      }
    }
    if (errObj.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "lobbyRemove()",
        errObj
      )
    }

    return (lobbyData);
  }

  async lobbyCreate(lobbyCreateDto: LobbyCreate.InputDto) {

    const inputPayload = LobbyCreate.schema.input.safeParse(lobbyCreateDto);

    if (!inputPayload.success) {
      throw errorWithCode(
        HttpStatus.BAD_REQUEST,
        "payload validation failed",
        z.treeifyError(inputPayload.error)
      );
    }

    let redisReturnValue = 0;
    let newLobbyPinId: string = "";
    let addNewLobbyRes: boolean = false;
    const retriesLimit = 10;
    for (let i = 0; i < retriesLimit; i++) {
      newLobbyPinId = this.generateNewLobbyPinId();
      addNewLobbyRes = await this.userRedisService.addNewLobby(inputPayload.data.details.createdByUserId, newLobbyPinId);
      if (addNewLobbyRes === false) {
        redisReturnValue = 3;
        break ;
      }

      redisReturnValue = await this.redis.setWithLimitAdd(
        redis_lobby_global_details_lobby_lists(),
        newLobbyPinId,
        LOBBY_ROOM_MAX,
      )

      if (redisReturnValue !== 2) {
        // if the return code if not 2 then no need to retries
        break ;
      }
      await this.userRedisService.removeUserLobbyList(inputPayload.data.details.createdByUserId, newLobbyPinId);
    }

    if (redisReturnValue !== 0 ) {
      if (redisReturnValue === 1) {
        throw errorWithCode(
          HttpStatus.SERVICE_UNAVAILABLE,
          "the lobby is full and cannot insert any more room"
        );
      }
      else if (redisReturnValue === 2) {
        throw errorWithCode(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "cannot insert the room within the amout of retires"
        )
      }
      else {
        throw errorWithCode(
          HttpStatus.FORBIDDEN,
          "this user cannot create or join anymore lobby room, try to leave from another lobby room first"
        );
      }
    }

    const newChatRoomData = await this.chatService.createNewChatRoom({
      createdByUserId: null,
      isTemporary: true,
      roomName: `lobby ${newLobbyPinId}`,
      visibilityType: ChatRoomVisibilityType.PRIVATE
    })


    const lobbyDto: z.input<typeof Lobby.schema.insert> = {
      generalSettings: inputPayload.data.generalSettings,
      details: {
        ...inputPayload.data.details,
        roomPinId: newLobbyPinId,
        currentPlayerCount: 1,
        currentSpectatorCount: 0,
        chatRoomId: newChatRoomData.id
      },
      gameSettings: inputPayload.data.gameSettings
    }

    const lobbyPayload = Lobby.schema.insert.safeParse(lobbyDto);

    if (!lobbyPayload.success) {

      const errorObj = z.treeifyError(lobbyPayload.error);

      throw logError(
        this.logger,
        "error from lobbyCreate()",
        "lobby payload invalid",
        HttpStatus.INTERNAL_SERVER_ERROR,
        errorObj
      );

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
      .exec();

    if (!allRes) {
      throw logErrorRedisPipeLine(
        this.logger,
        "lobbyCreate()",
      )
      // 
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
      throw logErrorRedisPipeLine(
        this.logger,
        "getLobbyMemberList()",
      );
    }

    const errObj: Error[] = [];
    for (const [err] of res) {
      if (err) {
        errObj.push(err);
      }
    }

    if (errObj.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "getLobbyMemberList()",
        errObj
      )
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
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "the lobby not found"
      )
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
      throw logErrorRedisPipeLine(
        this.logger,
        "getLobbyFull()"
      );
    }

    const errObj: Error[] = [];
    for (const [err] of allRes) {
      if (err) {
        errObj.push(err);
      }

    }

    if (errObj.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "getLobbyFull()",
        errObj
      )
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

  // get all info of all lobby
  async getAllLobby() {
    const allLobbyList = await this.redis.smembers(
      redis_lobby_global_details_lobby_lists()
    )

    const allPromise = allLobbyList.map((id) => {
      return this.getLobbyFull(id).catch(() => null)
    })

    const result = (await Promise.all(allPromise)).filter((data) => data !== null);

    return result;
  }


  // ready toggle state, just flip
  // true means ready and false mean not ready
  async lobbyUserReadyState(userId: string, lobbyRoomId: string) {
    
    // check if user really in this lobby room
    const [
      isUserinLobby,
      lobbyData
    ] = await Promise.all([
      this.userRedisService.isUserInLobby(userId, lobbyRoomId),
      this.getLobbyFull(lobbyRoomId)
    ])

    if (isUserinLobby === false) {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "must be in the lobby to press ready button"
      )
    }

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

  async lobbyUserLeave(userId: string, lobbyPinId: string) {
    const lobbyData = await this.getLobbyFull(lobbyPinId);

    const res = await this.redis.lobbyRoomLeave(
      redis_lobby_player_member_list(lobbyPinId),
      redis_lobby_spectator_member_list(lobbyPinId),
      redis_lobby_global_details_lobby_lists(),
      redis_user_lobby_list(userId),
      redis_lobby_general_settings(lobbyPinId),
      redis_lobby_game_settings(lobbyPinId),
      userId,
      lobbyPinId
    );

    if (res !== 0) {
      if (res === 1) {
        throw errorWithCode(
          HttpStatus.NOT_FOUND,
          "target lobby is not found"
        )
      }
      else if (res === 2) {
        throw logError(
          this.logger,
          "error from LobbyUserLeave()",
          "the user is not in player member list, or spectator member list",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      else if (res === 3) {
        throw errorWithCode(
          HttpStatus.NOT_FOUND,
          "the user is not in the targeted lobby"
        )
      }
      else if (res === 4) {
        // the lobby room got destroyed
        // chat room needs to be remove as well
        await this.chatService.removeRoom(lobbyData.details.chatRoomId);
      }
    }

    await this.chatService.leaveRoom(userId, lobbyData.details.chatRoomId);
  }

  async lobbyUserJoin(userId: string, lobbyPinId:string, isSpectator: boolean = false, password?: string) {

    const lobbyData = await this.getLobbyFull(lobbyPinId);

    const res = await this.redis.lobbyRoomJoin(
      redis_user_lobby_list(userId),
      redis_lobby_global_details_lobby_lists(),
      redis_lobby_spectator_member_list(lobbyPinId),
      redis_lobby_player_member_list(lobbyPinId),
      redis_lobby_game_settings(lobbyPinId),
      redis_lobby_general_settings(lobbyPinId),
      isSpectator === true ? "true" : "false",
      userId,
      password ?? "",
      lobbyPinId,
      new Date().toISOString(),
      REDIS_USER_LOBBY_LIST_LIMIT
    );

    if (res !== 0) {
      if (res === 1) {
        throw errorWithCode(
          HttpStatus.CONFLICT,
          "user cannot join any more new lobby"
        )
      }
      else if (res === 2) {
        throw errorWithCode(
          HttpStatus.CONFLICT,
          "user is already in the target lobby room"
        )
      }
      else if (res === 3) {
        throw errorWithCode(
          HttpStatus.NOT_FOUND,
          "the target lobby is not found"
        )
      }
      else if (res === 4) {
        throw errorWithCode(
          HttpStatus.FORBIDDEN,
          "the lobby room is unavailable to join"
        )
      }
      else if (res === 5) {
        throw errorWithCode(
          HttpStatus.FORBIDDEN,
          "the lobby room must be in waiting state for user to join as pleyer member"
        );
      }
      else if (res === 6) {
        throw errorWithCode(
          HttpStatus.FORBIDDEN,
          "Invalid lobby password"
        )
      }
      else if (res === 7) {
        throw errorWithCode(
          HttpStatus.SERVICE_UNAVAILABLE,
          "the lobby room is now full. try again later"
        )
      }
      else if (res === 8) {
        throw logError(
          this.logger,
          "error from lobbyUserJoin",
          "the  user cannot be added to member of the lobby",
          HttpStatus.INTERNAL_SERVER_ERROR,
          {
            message: `user ${userId}. to lobby ${lobbyPinId}`
          }
        )
      }
      else {
        throw logError(
          this.logger,
          "error from lobbyUserJoin",
          "unknown res return from ioredis define command",
          HttpStatus.INTERNAL_SERVER_ERROR,
          {
            res: res
          }
        );
      }
    }

    // if join success then this user join the chat room

    await this.chatService.leaveRoom(userId, lobbyData.details.chatRoomId);
    return lobbyData;
  }

  async lobbySetHost(userId: string, lobbyPinId: string) {
    // promote the target user Id to 

    const [
      isUserInLobby,
      lobbyData
    ] = await Promise.all([
      this.userRedisService.isUserInLobby(userId, lobbyPinId),
      this.getLobbyFull(lobbyPinId)
    ]);

    if (isUserInLobby === false) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "not found user in the target lobby"
      )
    }

    if (lobbyData.details.hostUserId === userId) {
      throw errorWithCode(
        HttpStatus.CONFLICT,
        "this user is already be the host of this lobby"
      )
    }

    await this.redis.hset(redis_lobby_details(lobbyPinId), "hostUserId", userId);

    return this.getLobbyFull(lobbyPinId);
  }

  async setLobbyRoomStatus(lobbyPinId: string, status: LobbyRoomStatus) {
    const res = await this.redis.lobbyRoomSetStatus(
      redis_lobby_global_details_lobby_lists(),
      redis_lobby_general_settings(lobbyPinId),
      lobbyPinId,
      status.toString()
    );
    
    if (res !== 0) {
      if (res === 1) {
        throw errorWithCode(
          HttpStatus.NOT_FOUND,
          "the lobby if not found"
        )
      }
      else if (res === 2) {
        throw errorWithCode(
          HttpStatus.CONFLICT,
          " the lobby is already on the set state"
        )
      }
      else {
        throw logError(
          this.logger,
          "error from setLobbyRoomStatus",
          "unknown res return from ioredis define command",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async updateLobby(lobbyPinId: string, updateInputDto: z.input<typeof lobbyUpdateSchema>) {

    // must be in waiting state

    const lobbyData = await this.getLobbyFull(lobbyPinId);

    if (lobbyData.details.roomStatus !== LobbyRoomStatus.WAITING) {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "lobby must be in waiting stage to update the lobby settings"
      )
    }

    if (updateInputDto.gameSettings.maxPlayer) {
      if (lobbyData.details.currentPlayerCount > updateInputDto.gameSettings.maxPlayer) {
        throw errorWithCode(
          HttpStatus.CONFLICT,
          "cannot update the lobby setting max player to less then current player in the lobby"
        )
      }
    }

    if (updateInputDto.gameSettings.maxSpectator) {
      if (lobbyData.details.currentSpectatorCount ?? 0 > updateInputDto.gameSettings.maxSpectator) {
        throw errorWithCode(
          HttpStatus.CONFLICT,
          "cannot update the lobby setting max spectator to less then current spectator in the lobby"
        )
      }
    }

    const parsePayload = lobbyUpdateSchema.safeParse(updateInputDto);

    if (!parsePayload.success) {
      throw logError(
        this.logger,
        "error from updateLobby()",
        "update payload invalid",
        HttpStatus.BAD_REQUEST,
        z.treeifyError(parsePayload.error)
      )
    }

    const newLobbyInsert: z.input<typeof Lobby.schema.insert> = {
      details: lobbyData.details,
      gameSettings: {
        ...lobbyData.gameSettings,
        ...updateInputDto.gameSettings,
      },
      generalSettings: {
        ...lobbyData.generalSettings,
        ...updateInputDto.generalSettings
      }
    }

    const parseLobbyInsert = Lobby.schema.insert.safeParse(newLobbyInsert);

    if (!parseLobbyInsert.success) {
      throw errorWithCode(
        HttpStatus.BAD_REQUEST,
        "update lobby invalid payload",
        z.treeifyError(parseLobbyInsert.error)
      )
    }
    const data = parseLobbyInsert.data;

    const fullLobby: Lobby.FullDto = {
      details: data.details,
      gameSettings: data.gameSettings,
      generalSettings: data.generalSettings
    };

    const records = this.lobbyToRecord(fullLobby);
    const res = await this.redis.pipeline()
      .hset(redis_lobby_details(lobbyPinId), records.lobbyDetails)
      .hset(redis_lobby_general_settings(lobbyPinId), records.generalSettings)
      .hset(redis_lobby_game_settings(lobbyPinId), records.gameSettings)
      .exec();

    if (!res) {
      throw logErrorRedisPipeLine(
        this.logger,
        "updateLobby()"
      );
    }

    const errs: Error[] = [];
    for (const [err] of res) {
      if (err) {
        errs.push(err);
      }
    }
    if (errs.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "updateLobby()",
        errs
      );
    }

    return fullLobby;
  }

  async toggleReady(userId: string, lobbyPinId: string) {
    const [
      lobbyMemberList,
      lobbyData,
      isUserInLobby,
    ] = await Promise.all([
      this.getLobbyMemberList(lobbyPinId),
      this.getLobbyFull(lobbyPinId),
      this.userRedisService.isUserInLobby(userId, lobbyPinId)
    ])

    if (lobbyData.details.roomStatus !== LobbyRoomStatus.WAITING) {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "lobby must be in waiting status to be able to press ready"
      );
    }

    if (isUserInLobby === false) {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "must be in the lobby to press ready button"
      );
    }

    if (lobbyMemberList.playerList.includes(userId) === false) {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "user must be player to press ready"
      );
    }

    if (lobbyMemberList.readyPlayerList.includes(userId)) {
      await this.redis.srem(redis_lobby_ready_player_list(lobbyPinId), userId);

      return false
    }
    else {
      await this.redis.sadd(redis_lobby_ready_player_list(lobbyPinId), userId);

      return true;
    }
  }

  async startGameRoom(lobbyPinId: string) {

    // NOTE: must perform as atomic on lua script on redis

    // 1. retrieve the lobby data from redis
    //
    const [
      lobbyData,
      lobbyMemberList
    ] = await Promise.all([
      this.getLobbyFull(lobbyPinId),
      this.getLobbyMemberList(lobbyPinId)
    ]);

    // checks
    // 1. check if the lobby is on WAITNG state
    if (lobbyData.details.roomStatus !== LobbyRoomStatus.WAITING) {
      throw errorWithCode(HttpStatus.FORBIDDEN, "the lobby must be in waiting state to start a game")
    }
    // 2. check that all player user in the room is ready
    if (
      lobbyMemberList.playerList.length === lobbyMemberList.readyPlayerList.length
      || (lobbyMemberList.playerList.includes(lobbyData.details.hostUserId) === true
        && lobbyMemberList.readyPlayerList.length + 1 >= lobbyMemberList.playerList.length)
    ) {

      await this.setLobbyRoomStatus(lobbyPinId,
        LobbyRoomStatus.UNAVAILABLE
      );

      const res = await this.gameRedisService.gameRoomCreate({
        lobbyData: await this.getLobbyFull(lobbyPinId),
        lobbyMemberList: lobbyMemberList
      });


      // gonna set the game room id of the lobby room to be linkable
      await this.redis.hset(redis_lobby_details(lobbyPinId), "gameRoomId", res.gameRoomId);

      await this.setLobbyRoomStatus(lobbyPinId, LobbyRoomStatus.PLAYING);
      return this.getLobbyFull(lobbyPinId);
    }
    else {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "all player must ready to start a poker game"
      )
    }

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