import { forwardRef, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/redis/redis.provider.js";
import { UsersRedisService } from "../../user/redis/users-redis.service.js";
import { ChatService } from "../../chat/chat.service.js";
import { LobbyGatewayService } from "../../../api/websocket/main-gateway/lobby-gateway/lobby-gateway.service.js";
import { GameGatewayService } from "../../../api/websocket/game-gateway/game-gameway.service.js";
import { GameRedisService } from "../../game/redis/game-redis.service.js";
import * as crypto from "node:crypto";
import { Lobby } from "./schemas/lobby.redis.schema.js";
import { LobbyRecordsDto } from "./dtos/lobby-records.dto.js";
import { LobbyRoomStatus } from "./schemas/lobby-details.redis.schema.js";
import { GameSettingFormat } from "./schemas/lobby-gameSettings.redis.schema.js";
import { LobbyRoomType } from "./schemas/lobby-generalSettings.redis.schema.js";
import {
  redis_lobby_all_keys,
  redis_lobby_details,
  redis_lobby_game_settings,
  redis_lobby_general_settings,
  redis_lobby_global_details_lobby_lists,
  redis_lobby_player_member_list,
  redis_lobby_ready_player_list,
  redis_lobby_spectator_member_list,
} from "./lobby-redis.namespace.js";
import { logErrorRedisError, logErrorRedisPipeLine } from "../../../infrastructure/redis/utility/redis-logError.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";
import { LobbyDto } from "./dtos/lobby.dto.js";
import { redis_user_lobby_list } from "../../user/redis/users-redis.namespace.js";
import { LobbyMemberNotifyRole } from "../../../api/websocket/main-gateway/lobby-gateway/dtos/member-notify.dto.js";
import { logError } from "../../../utility/logError.js";
import { REDIS_USER_LOBBY_LIST_LIMIT } from "../../user/redis/users-redis.constants.js";
import { LobbyUpdateDto } from "./dtos/lobby-update.dto.js";
import { lobbyUpdateSchema } from "./schemas/lobby-update.redis.schema.js";
import z from "zod";
import { LobbyCreate } from "./schemas/lobby-create.redis.schema.js";
import { LOBBY_ROOM_MAX } from "../lobby.constants.js";
import { ChatRoomVisibilityType } from "../../../infrastructure/drizzle/schema/chat_rooms/chat_rooms.schema.js";
import { type WrapperType } from "../../../types/wrapperType.js";

@Injectable()
export class LobbyRedisService implements OnModuleInit {
  private readonly logger = new Logger(LobbyRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly userRedisService: UsersRedisService,
    private readonly chatService: ChatService,
    private readonly gameRedisService: GameRedisService,
    @Inject(forwardRef(() => LobbyGatewayService))
    private readonly lobbyGatewayService: WrapperType<LobbyGatewayService>,
    private readonly gameGatewayService: GameGatewayService,
  ) {}

  async onModuleInit() {
    await this.redis.defineCommand("lobbyRoomCreate", {
      numberOfKeys: 2,
      readOnly: false,
      lua: `
        local allLobbyListsKey = KEYS[1]
        local creatorUserLobbyListKey = KEYS[2]

        local lobbyRoomMax = tonumber(ARGV[1])
        local newLobbyPinId = ARGV[2]
        local hasCreator = ARGV[3]
        local userLobbyLimit = tonumber(ARGV[4])

        if hasCreator == 'true' then
          if redis.call('SCARD', creatorUserLobbyListKey) >= userLobbyLimit then
            return 3
          end
        end

        if redis.call('SCARD', allLobbyListsKey) >= lobbyRoomMax then
          return 1
        end

        if redis.call('SADD', allLobbyListsKey, newLobbyPinId) ~= 1 then
          return 2
        end

        return 0
      `,
    });

    await this.redis.defineCommand("lobbyRoomJoin", {
      numberOfKeys: 7,
      readOnly: false,
      lua: `
        local userLobbyListKey = KEYS[1]
        local allLobbyListsKey = KEYS[2]
        local spectatorMemberListKey = KEYS[3]
        local playerMemberListKey = KEYS[4]
        local lobbyGameSettingsKey = KEYS[5]
        local lobbyGeneralSettingsKey = KEYS[6]
        local lobbyDetailsKey = KEYS[7]

        local isSpectator = ARGV[1]
        local joinUserId = ARGV[2]
        local password = ARGV[3]
        local lobbyPinId = ARGV[4]
        local joinedAt = tonumber(ARGV[5])
        local userLobbyListLimit = tonumber(ARGV[6])

        if redis.call('SCARD', userLobbyListKey) >= userLobbyListLimit then
          return 1
        end

        if redis.call('SISMEMBER', userLobbyListKey, lobbyPinId) ~= 0 then
          return 2
        end

        if redis.call('SISMEMBER', allLobbyListsKey, lobbyPinId) == 0 then
          return 3
        end

        local currentLobbyStatus = redis.call('HGET', lobbyDetailsKey, 'roomStatus')
        if not currentLobbyStatus or currentLobbyStatus == 'UNAVAILABLE' then
          return 4
        elseif isSpectator == 'false' and currentLobbyStatus ~= 'WAITING' then
          return 5
        end

        local lobbyPassword = redis.call('HGET', lobbyGeneralSettingsKey, 'password')
        if lobbyPassword and lobbyPassword ~= '' then
          if password ~= lobbyPassword then
            return 6
          end
        end

        if isSpectator == 'true' then
          local currentSpectatorCount = redis.call('ZCARD', spectatorMemberListKey)
          local maxSpectator = tonumber(redis.call('HGET', lobbyGameSettingsKey, 'maxSpectator') or 0)

          if currentSpectatorCount >= maxSpectator then
            return 7
          end

          if redis.call('ZADD', spectatorMemberListKey, joinedAt, joinUserId) ~= 1 then
            return 8
          end

          redis.call('HSET', lobbyDetailsKey, 'currentSpectatorCount', currentSpectatorCount + 1)
        else
          local currentPlayerCount = redis.call('ZCARD', playerMemberListKey)
          local maxPlayer = tonumber(redis.call('HGET', lobbyGameSettingsKey, 'maxPlayer') or 0)

          if currentPlayerCount >= maxPlayer then
            return 7
          end

          if redis.call('ZADD', playerMemberListKey, joinedAt, joinUserId) ~= 1 then
            return 8
          end

          redis.call('HSET', lobbyDetailsKey, 'currentPlayerCount', currentPlayerCount + 1)
        end

        redis.call('SADD', userLobbyListKey, lobbyPinId)

        return 0
      `,
    });

    await this.redis.defineCommand("lobbyRoomLeave", {
      numberOfKeys: 8,
      readOnly: false,
      lua: `
        local playerMemberListKey = KEYS[1]
        local spectatorMemberListKey = KEYS[2]
        local allLobbyListKey = KEYS[3]
        local userLobbyListKey = KEYS[4]
        local generalSettingsKey = KEYS[5]
        local gameSettingsKey = KEYS[6]
        local lobbyDetailsKey = KEYS[7]
        local readyPlayerListKey = KEYS[8]

        local leaveUserId = ARGV[1]
        local lobbyPinId = ARGV[2]
        local matchComplete = ARGV[3] == 'true'

        if redis.call('SISMEMBER', userLobbyListKey, lobbyPinId) == 0 then
          return 3
        end

        if redis.call('SISMEMBER', allLobbyListKey, lobbyPinId) == 0 then
          return 1
        end

        local isPlayer = redis.call('ZSCORE', playerMemberListKey, leaveUserId) ~= false
        local isSpectator = redis.call('ZSCORE', spectatorMemberListKey, leaveUserId) ~= false

        if not isPlayer and not isSpectator then
          return 2
        end

        local currentState = redis.call('HGET', lobbyDetailsKey, 'roomStatus')
        if currentState == 'UNAVAILABLE' then
          return 5
        elseif isPlayer and currentState ~= 'WAITING' and not matchComplete then
          return 6
        end

        if isPlayer then
          redis.call('ZREM', playerMemberListKey, leaveUserId)
          redis.call('SREM', readyPlayerListKey, leaveUserId)
        else
          redis.call('ZREM', spectatorMemberListKey, leaveUserId)
        end

        redis.call('SREM', userLobbyListKey, lobbyPinId)

        local curPCount = tonumber(redis.call('ZCARD', playerMemberListKey))
        local curSCount = tonumber(redis.call('ZCARD', spectatorMemberListKey))

        redis.call('HSET', lobbyDetailsKey, 'currentPlayerCount', curPCount, 'currentSpectatorCount', curSCount)

        if curPCount <= 0 and curSCount <= 0 then
          return 4
        end

        local hostUserId = redis.call('HGET', lobbyDetailsKey, 'hostUserId')
        if hostUserId and hostUserId == leaveUserId then
          local oldestPlayerMember = redis.call('ZRANGE', playerMemberListKey, 0, 0, 'WITHSCORES')
          local oldestSpectatorMember = redis.call('ZRANGE', spectatorMemberListKey, 0, 0, 'WITHSCORES')

          local newHostId = ''
          if oldestPlayerMember[1] and oldestSpectatorMember[1] then
            local playerTimestamp = tonumber(oldestPlayerMember[2])
            local spectatorTimestamp = tonumber(oldestSpectatorMember[2])
            if playerTimestamp <= spectatorTimestamp then
              newHostId = oldestPlayerMember[1]
            else
              newHostId = oldestSpectatorMember[1]
            end
          elseif oldestPlayerMember[1] then
            newHostId = oldestPlayerMember[1]
          elseif oldestSpectatorMember[1] then
            newHostId = oldestSpectatorMember[1]
          end

          redis.call('HSET', lobbyDetailsKey, 'hostUserId', newHostId)
          return newHostId
        end

        return 0
      `,
    });

    await this.redis.defineCommand("lobbyRoomSetStatus", {
      numberOfKeys: 2,
      readOnly: false,
      lua: `
        local allLobbyListKey = KEYS[1]
        local lobbyDetailsKey = KEYS[2]

        local lobbyPinId = ARGV[1]
        local setStatus = ARGV[2]

        if tonumber(redis.call('SISMEMBER', allLobbyListKey, lobbyPinId)) == 0 then
          return 1
        end

        local currentStatus = redis.call('HGET', lobbyDetailsKey, 'roomStatus')

        if not currentStatus or currentStatus == setStatus then
          return 2
        end

        redis.call('HSET', lobbyDetailsKey, 'roomStatus', setStatus)
        return 0
      `,
    });
  }

  generateNewLobbyPinId(): string {
    return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  }

  private lobbyToRecord(fullLobbyDto: Lobby.FullDto): LobbyRecordsDto {
    const detailsRecord = Object.fromEntries(
      Object.entries(fullLobbyDto.details).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : String(value ?? ""),
      ]),
    );
    const generalSettingsRecord = Object.fromEntries(
      Object.entries(fullLobbyDto.generalSettings).map(([key, value]) => [key, String(value ?? "")]),
    );
    const gameSettingsRecord = Object.fromEntries(
      Object.entries(fullLobbyDto.gameSettings).map(([key, value]) => [key, String(value ?? "")]),
    );

    return {
      lobbyDetails: detailsRecord,
      generalSettings: generalSettingsRecord,
      gameSettings: gameSettingsRecord,
    };
  }

  private recordToLobby(records: LobbyRecordsDto): Lobby.FullDto {
    return {
      details: {
        chatRoomId: records.lobbyDetails.chatRoomId,
        gameRoomId: records.lobbyDetails.gameRoomId ? records.lobbyDetails.gameRoomId : null,
        createdAt: new Date(records.lobbyDetails.createdAt),
        createdByUserId: records.lobbyDetails.createdByUserId ? records.lobbyDetails.createdByUserId : null,
        hostUserId: records.lobbyDetails.hostUserId ? records.lobbyDetails.hostUserId : null,
        roomPinId: records.lobbyDetails.roomPinId,
        roomStatus: records.lobbyDetails.roomStatus as LobbyRoomStatus,
        currentPlayerCount: parseInt(records.lobbyDetails.currentPlayerCount, 10),
        currentSpectatorCount: parseInt(records.lobbyDetails.currentSpectatorCount, 10),
      },
      gameSettings: {
        maxPlayer: parseInt(records.gameSettings.maxPlayer, 10),
        maxSpectator: parseInt(records.gameSettings.maxSpectator, 10),
        format: records.gameSettings.format as GameSettingFormat,
        startingChips: parseInt(records.gameSettings.startingChips, 10),
        bigBlind: parseInt(records.gameSettings.bigBlind, 10),
        ante: records.gameSettings.ante ? parseInt(records.gameSettings.ante, 10) : null,
      },
      generalSettings: {
        catchPhrase: records.generalSettings.catchPhrase ? records.generalSettings.catchPhrase : null,
        password: records.generalSettings.password ? records.generalSettings.password : null,
        roomType: records.generalSettings.roomType as LobbyRoomType,
      },
    };
  }

  async lobbyRemove(lobbyPinId: string) {
    const [lobbyMemberList, lobbyData] = await Promise.all([
      this.getLobbyMemberList(lobbyPinId),
      this.getLobbyFull(lobbyPinId),
    ]);

    const pipeline = this.redis.pipeline();

    for (const playerId of lobbyMemberList.playerList) {
      pipeline.srem(redis_user_lobby_list(playerId), lobbyPinId);
    }
    for (const spectatorId of lobbyMemberList.spectatorList) {
      pipeline.srem(redis_user_lobby_list(spectatorId), lobbyPinId);
    }

    pipeline
      .srem(redis_lobby_global_details_lobby_lists(), lobbyPinId)
      .del(redis_lobby_all_keys(lobbyPinId));

    const res = await pipeline.exec();

    if (!res) {
      throw logErrorRedisPipeLine(this.logger, "lobbyRemove()");
    }

    const errObj: Error[] = [];
    for (const [err] of res) {
      if (err) {
        errObj.push(err);
      }
    }
    if (errObj.length !== 0) {
      throw logErrorRedisError(this.logger, "lobbyRemove()", errObj);
    }

    await this.chatService.removeRoom(lobbyData.details.chatRoomId).catch(() => null);

    const allMembers = [
      ...lobbyMemberList.playerList.map((id) => ({ id, role: LobbyMemberNotifyRole.PLAYER })),
      ...lobbyMemberList.spectatorList.map((id) => ({ id, role: LobbyMemberNotifyRole.SPECTATOR })),
    ];

    for (const member of allMembers) {
      if (lobbyData.details.roomStatus === LobbyRoomStatus.PLAYING && lobbyData.details.gameRoomId) {
        this.gameGatewayService.leaveGameSession(member.id, lobbyData.details.gameRoomId);
      }
      this.lobbyGatewayService.leaveLobbySession(member.id, lobbyPinId, member.role);
    }

    return lobbyData;
  }

  async lobbyCreate(lobbyCreateDto: LobbyCreate.InputDto) {
    const inputPayload = LobbyCreate.schema.input.safeParse(lobbyCreateDto);

    if (!inputPayload.success) {
      throw errorWithCode(
        HttpStatus.BAD_REQUEST,
        "payload validation failed",
        z.treeifyError(inputPayload.error),
      );
    }

    let redisReturnValue = 0;
    let newLobbyPinId = "";
    const retriesLimit = 10;

    for (let i = 0; i < retriesLimit; i++) {
      newLobbyPinId = this.generateNewLobbyPinId();
      redisReturnValue = await this.redis.lobbyRoomCreate(
        redis_lobby_global_details_lobby_lists(),
        redis_user_lobby_list(inputPayload.data.details.createdByUserId ?? ""),
        LOBBY_ROOM_MAX,
        newLobbyPinId,
        inputPayload.data.details.createdByUserId === null ? "false" : "true",
        REDIS_USER_LOBBY_LIST_LIMIT,
      );

      if (redisReturnValue !== 2) {
        break;
      }
    }

    if (redisReturnValue !== 0) {
      if (redisReturnValue === 1) {
        throw errorWithCode(
          HttpStatus.SERVICE_UNAVAILABLE,
          "the lobby is full and cannot insert any more room",
        );
      } else if (redisReturnValue === 2) {
        throw errorWithCode(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "cannot insert the room within the amount of retries",
        );
      } else {
        throw errorWithCode(
          HttpStatus.FORBIDDEN,
          "this user cannot create or join anymore lobby room, try to leave from another lobby room first",
        );
      }
    }

    let chatRoomCreatedId: string | null = null;
    try {
      const newChatRoomData = await this.chatService.createNewChatRoom({
        createdByUserId: null,
        isTemporary: true,
        roomName: `lobby ${newLobbyPinId}`,
        visibilityType: ChatRoomVisibilityType.PRIVATE,
      });
      chatRoomCreatedId = newChatRoomData.id;

      const lobbyDto: z.input<typeof Lobby.schema.insert> = {
        generalSettings: inputPayload.data.generalSettings,
        details: {
          ...inputPayload.data.details,
          roomPinId: newLobbyPinId,
          currentPlayerCount: 0,
          currentSpectatorCount: 0,
          chatRoomId: newChatRoomData.id,
        },
        gameSettings: inputPayload.data.gameSettings,
      };

      const lobbyPayload = Lobby.schema.insert.safeParse(lobbyDto);

      if (!lobbyPayload.success) {
        const errorObj = z.treeifyError(lobbyPayload.error);
        throw logError(
          this.logger,
          "error from lobbyCreate()",
          "lobby payload invalid",
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorObj,
        );
      }

      const fullLobbyPayload: z.infer<typeof Lobby.schema.full> = {
        details: { ...lobbyPayload.data.details },
        gameSettings: lobbyPayload.data.gameSettings,
        generalSettings: lobbyPayload.data.generalSettings,
      };

      const records = this.lobbyToRecord(fullLobbyPayload);

      const allRes = await this.redis
        .pipeline()
        .hset(redis_lobby_general_settings(newLobbyPinId), records.generalSettings)
        .hset(redis_lobby_game_settings(newLobbyPinId), records.gameSettings)
        .hset(redis_lobby_details(newLobbyPinId), records.lobbyDetails)
        .exec();

      if (!allRes) {
        throw logErrorRedisPipeLine(this.logger, "lobbyCreate()");
      }

      const errs: Error[] = [];
      for (const [err] of allRes) {
        if (err) {
          errs.push(err);
        }
      }
      if (errs.length !== 0) {
        throw logErrorRedisError(this.logger, "lobbyCreate()", errs);
      }

      if (inputPayload.data.details.createdByUserId) {
        await this.lobbyUserJoin(
          inputPayload.data.details.createdByUserId,
          newLobbyPinId,
          false,
          inputPayload.data.generalSettings.password ?? undefined,
        );

        await this.lobbySetHost(inputPayload.data.details.createdByUserId, newLobbyPinId).catch(() => {});

        return this.getLobbyFull(newLobbyPinId);
      }

      return fullLobbyPayload;
    } catch (error) {
      await this.redis
        .pipeline()
        .srem(redis_lobby_global_details_lobby_lists(), newLobbyPinId)
        .del(redis_lobby_all_keys(newLobbyPinId))
        .exec()
        .catch(() => null);

      if (chatRoomCreatedId) {
        await this.chatService.removeRoom(chatRoomCreatedId).catch(() => null);
      }
      throw error;
    }
  }

  async getLobbyMemberList(lobbyPinId: string) {
    const res = await this.redis
      .pipeline()
      .sismember(redis_lobby_global_details_lobby_lists(), lobbyPinId)
      .zrange(redis_lobby_player_member_list(lobbyPinId), 0, "-1")
      .zrange(redis_lobby_spectator_member_list(lobbyPinId), 0, "-1")
      .smembers(redis_lobby_ready_player_list(lobbyPinId))
      .exec();

    if (!res) {
      throw logErrorRedisPipeLine(this.logger, "getLobbyMemberList()");
    }

    const errObj: Error[] = [];
    for (const [err] of res) {
      if (err) {
        errObj.push(err);
      }
    }

    if (errObj.length !== 0) {
      throw logErrorRedisError(this.logger, "getLobbyMemberList()", errObj);
    }

    const [[, isLobbyExist], [, playerMemberList], [, spectatorMemberList], [, readyPlayerList]] = res as [
      [Error | null, number],
      [Error | null, string[]],
      [Error | null, string[]],
      [Error | null, string[]],
    ];

    if (isLobbyExist === 0) {
      throw errorWithCode(HttpStatus.NOT_FOUND, "the lobby not found");
    }

    return {
      playerList: playerMemberList,
      spectatorList: spectatorMemberList,
      readyPlayerList: readyPlayerList,
    };
  }

  getPlayerMemberList(lobbyPinId: string) {
    return this.redis.zrange(redis_lobby_player_member_list(lobbyPinId), 0, "-1");
  }

  getSpectatorMemberList(lobbyPinId: string) {
    return this.redis.zrange(redis_lobby_spectator_member_list(lobbyPinId), 0, "-1");
  }

  getReadyPlayerList(lobbyPinId: string) {
    return this.redis.smembers(redis_lobby_ready_player_list(lobbyPinId));
  }

  async getLobbyFull(lobbyPinId: string): Promise<LobbyDto> {
    const allRes = await this.redis
      .pipeline()
      .hgetall(redis_lobby_details(lobbyPinId))
      .hgetall(redis_lobby_general_settings(lobbyPinId))
      .hgetall(redis_lobby_game_settings(lobbyPinId))
      .exec();

    if (!allRes) {
      throw logErrorRedisPipeLine(this.logger, "getLobbyFull()");
    }

    const errObj: Error[] = [];
    for (const [err] of allRes) {
      if (err) {
        errObj.push(err);
      }
    }

    if (errObj.length !== 0) {
      throw logErrorRedisError(this.logger, "getLobbyFull()", errObj);
    }

    const [[, details], [, generalSettings], [, gameSettings]] = allRes as [
      [Error | null, Record<string, string>],
      [Error | null, Record<string, string>],
      [Error | null, Record<string, string>],
    ];

    if (!details || Object.keys(details).length === 0) {
      throw errorWithCode(HttpStatus.NOT_FOUND, "the target lobby is not found");
    }

    return this.recordToLobby({
      lobbyDetails: details,
      gameSettings: gameSettings,
      generalSettings: generalSettings,
    });
  }

  async getAllLobby() {
    const allLobbyList = await this.redis.smembers(redis_lobby_global_details_lobby_lists());

    const allPromise = allLobbyList.map((id) => {
      return this.getLobbyFull(id).catch(() => null);
    });

    const result = (await Promise.all(allPromise)).filter((data) => data !== null);

    return result;
  }

  async lobbyUserLeave(userId: string, lobbyPinId: string) {
    const [lobbyData, lobbyMembers] = await Promise.all([
      this.getLobbyFull(lobbyPinId),
      this.getLobbyMemberList(lobbyPinId),
    ]);

    const matchComplete =
      lobbyData.details.roomStatus === LobbyRoomStatus.PLAYING &&
      lobbyData.details.gameRoomId !== null &&
      lobbyMembers.playerList.includes(userId)
        ? (await this.gameRedisService.loadMatchProgress(lobbyData.details.gameRoomId)).matchComplete
        : false;

    const res = await this.redis.lobbyRoomLeave(
      redis_lobby_player_member_list(lobbyPinId),
      redis_lobby_spectator_member_list(lobbyPinId),
      redis_lobby_global_details_lobby_lists(),
      redis_user_lobby_list(userId),
      redis_lobby_general_settings(lobbyPinId),
      redis_lobby_game_settings(lobbyPinId),
      redis_lobby_details(lobbyPinId),
      redis_lobby_ready_player_list(lobbyPinId),
      userId,
      lobbyPinId,
      String(matchComplete),
    );

    let lobbyDestroyed = false;
    if (typeof res === "string") {
      const hostRole = lobbyMembers.playerList.includes(res)
        ? LobbyMemberNotifyRole.PLAYER
        : LobbyMemberNotifyRole.SPECTATOR;
      this.lobbyGatewayService.memberNotifyChangeHost(res, lobbyPinId, hostRole);
    } else {
      switch (res) {
        case 0:
          break;
        case 1:
          throw errorWithCode(HttpStatus.NOT_FOUND, "target lobby is not found");
        case 2:
          throw logError(
            this.logger,
            "error from lobbyUserLeave()",
            "the user is not in player member list, or spectator member list",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        case 3:
          throw errorWithCode(HttpStatus.NOT_FOUND, "the user is not in the targeted lobby");
        case 4:
          lobbyDestroyed = true;
          await this.lobbyRemove(lobbyPinId);
          break;
        case 5:
          throw errorWithCode(
            HttpStatus.SERVICE_UNAVAILABLE,
            "the lobby room is currently in unavailable state to perform the leave room, try again later",
          );
        case 6:
          throw errorWithCode(
            HttpStatus.FORBIDDEN,
            "player cannot leave the room while lobby is not in WAITING STATE",
          );
        default:
          throw logError(
            this.logger,
            "error from lobbyUserLeave()",
            "ioredis defineCommand unknown return value",
            HttpStatus.INTERNAL_SERVER_ERROR,
            { res },
          );
      }
    }

    if (lobbyData.details.roomStatus === LobbyRoomStatus.PLAYING && lobbyData.details.gameRoomId) {
      this.gameGatewayService.leaveGameSession(userId, lobbyData.details.gameRoomId);
    }
    if (!lobbyDestroyed) {
      await this.chatService.leaveRoom(userId, lobbyData.details.chatRoomId);
    }
    const role = lobbyMembers.playerList.includes(userId)
      ? LobbyMemberNotifyRole.PLAYER
      : LobbyMemberNotifyRole.SPECTATOR;
    this.lobbyGatewayService.leaveLobbySession(userId, lobbyPinId, role);
  }

  async lobbyUserJoin(userId: string, lobbyPinId: string, isSpectator: boolean = false, password?: string) {
    this.logger.debug("redis lobby user join called");

    await this.getLobbyFull(lobbyPinId);

    let res: number;
    try {
      res = await this.redis.lobbyRoomJoin(
        redis_user_lobby_list(userId),
        redis_lobby_global_details_lobby_lists(),
        redis_lobby_spectator_member_list(lobbyPinId),
        redis_lobby_player_member_list(lobbyPinId),
        redis_lobby_game_settings(lobbyPinId),
        redis_lobby_general_settings(lobbyPinId),
        redis_lobby_details(lobbyPinId),
        isSpectator === true ? "true" : "false",
        userId,
        password ?? "",
        lobbyPinId,
        Date.now(),
        REDIS_USER_LOBBY_LIST_LIMIT,
      );
    } catch (error: any) {
      throw logError(
        this.logger,
        "error from lobbyUserJoin",
        "ioredis error",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
    }

    this.logger.debug({ message: `res return ${res}` });

    if (res !== 0) {
      if (res === 1) {
        throw errorWithCode(HttpStatus.CONFLICT, "user cannot join any more new lobby");
      } else if (res === 2) {
        throw errorWithCode(HttpStatus.CONFLICT, "user is already in the target lobby room");
      } else if (res === 3) {
        throw errorWithCode(HttpStatus.NOT_FOUND, "the target lobby is not found");
      } else if (res === 4) {
        throw errorWithCode(HttpStatus.FORBIDDEN, "the lobby room is unavailable to join");
      } else if (res === 5) {
        throw errorWithCode(
          HttpStatus.FORBIDDEN,
          "the lobby room must be in waiting state for user to join as player member",
        );
      } else if (res === 6) {
        throw errorWithCode(HttpStatus.FORBIDDEN, "Invalid lobby password");
      } else if (res === 7) {
        throw errorWithCode(HttpStatus.SERVICE_UNAVAILABLE, "the lobby room is now full. try again later");
      } else if (res === 8) {
        throw logError(
          this.logger,
          "error from lobbyUserJoin",
          "the user cannot be added to member of the lobby",
          HttpStatus.INTERNAL_SERVER_ERROR,
          { message: `user ${userId} to lobby ${lobbyPinId}` },
        );
      } else {
        throw logError(
          this.logger,
          "error from lobbyUserJoin",
          "unknown res return from ioredis define command",
          HttpStatus.INTERNAL_SERVER_ERROR,
          { res },
        );
      }
    }

    const updatedLobbyData = await this.getLobbyFull(lobbyPinId);

    if (updatedLobbyData.details.roomStatus === LobbyRoomStatus.PLAYING && updatedLobbyData.details.gameRoomId) {
      this.gameGatewayService.joinGameSession(userId, updatedLobbyData.details.gameRoomId);
    }

    await this.chatService.joinRoom(userId, updatedLobbyData.details.chatRoomId);
    this.lobbyGatewayService.joinLobbySession(
      userId,
      lobbyPinId,
      isSpectator ? LobbyMemberNotifyRole.SPECTATOR : LobbyMemberNotifyRole.PLAYER,
    );

    return updatedLobbyData;
  }

  async lobbySetHost(userId: string, lobbyPinId: string) {
    const [isUserInLobby, lobbyData, lobbyMembers] = await Promise.all([
      this.userRedisService.isUserInLobby(userId, lobbyPinId),
      this.getLobbyFull(lobbyPinId),
      this.getLobbyMemberList(lobbyPinId),
    ]);

    if (isUserInLobby === false) {
      throw errorWithCode(HttpStatus.NOT_FOUND, "not found user in the target lobby");
    }

    if (lobbyData.details.hostUserId === userId) {
      throw errorWithCode(HttpStatus.CONFLICT, "this user is already the host of this lobby");
    }

    await this.redis.hset(redis_lobby_details(lobbyPinId), "hostUserId", userId);
    const role = lobbyMembers.playerList.includes(userId)
      ? LobbyMemberNotifyRole.PLAYER
      : LobbyMemberNotifyRole.SPECTATOR;
    this.lobbyGatewayService.memberNotifyChangeHost(userId, lobbyPinId, role);
    return this.getLobbyFull(lobbyPinId);
  }

  async setLobbyRoomStatus(lobbyPinId: string, status: LobbyRoomStatus) {
    const res = await this.redis.lobbyRoomSetStatus(
      redis_lobby_global_details_lobby_lists(),
      redis_lobby_details(lobbyPinId),
      lobbyPinId,
      status.toString(),
    );

    if (res !== 0) {
      if (res === 1) {
        throw errorWithCode(HttpStatus.NOT_FOUND, "the lobby is not found");
      } else if (res === 2) {
        throw errorWithCode(HttpStatus.CONFLICT, "the lobby is already on the set state");
      } else {
        throw logError(
          this.logger,
          "error from setLobbyRoomStatus",
          "unknown res return from ioredis define command",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async updateLobby(lobbyPinId: string, updateInputDto: LobbyUpdateDto) {
    const parsePayload = lobbyUpdateSchema.safeParse(updateInputDto);

    if (!parsePayload.success) {
      throw logError(
        this.logger,
        "error from updateLobby()",
        "update payload invalid",
        HttpStatus.BAD_REQUEST,
        z.treeifyError(parsePayload.error),
      );
    }

    const lobbyData = await this.getLobbyFull(lobbyPinId);

    if (lobbyData.details.roomStatus !== LobbyRoomStatus.WAITING) {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "lobby must be in waiting stage to update the lobby settings",
      );
    }

    if (parsePayload.data.gameSettings?.maxPlayer !== undefined) {
      if (lobbyData.details.currentPlayerCount > parsePayload.data.gameSettings.maxPlayer) {
        throw errorWithCode(
          HttpStatus.CONFLICT,
          "cannot update the lobby setting max player to less than current player in the lobby",
        );
      }
    }

    if (parsePayload.data.gameSettings?.maxSpectator !== undefined) {
      if ((lobbyData.details.currentSpectatorCount ?? 0) > parsePayload.data.gameSettings.maxSpectator) {
        throw errorWithCode(
          HttpStatus.CONFLICT,
          "cannot update the lobby setting max spectator to less than current spectator in the lobby",
        );
      }
    }

    const newLobbyInsert: z.input<typeof Lobby.schema.insert> = {
      details: lobbyData.details,
      gameSettings: {
        ...lobbyData.gameSettings,
        ...parsePayload.data.gameSettings,
      },
      generalSettings: {
        ...lobbyData.generalSettings,
        ...parsePayload.data.generalSettings,
      },
    };

    const parseLobbyInsert = Lobby.schema.insert.safeParse(newLobbyInsert);

    if (!parseLobbyInsert.success) {
      throw errorWithCode(
        HttpStatus.BAD_REQUEST,
        "update lobby invalid payload",
        z.treeifyError(parseLobbyInsert.error),
      );
    }
    const data = parseLobbyInsert.data;

    const fullLobby: Lobby.FullDto = {
      details: data.details,
      gameSettings: data.gameSettings,
      generalSettings: data.generalSettings,
    };

    const records = this.lobbyToRecord(fullLobby);
    const res = await this.redis
      .pipeline()
      .hset(redis_lobby_details(lobbyPinId), records.lobbyDetails)
      .hset(redis_lobby_general_settings(lobbyPinId), records.generalSettings)
      .hset(redis_lobby_game_settings(lobbyPinId), records.gameSettings)
      .exec();

    if (!res) {
      throw logErrorRedisPipeLine(this.logger, "updateLobby()");
    }

    const errs: Error[] = [];
    for (const [err] of res) {
      if (err) {
        errs.push(err);
      }
    }
    if (errs.length !== 0) {
      throw logErrorRedisError(this.logger, "updateLobby()", errs);
    }

    return fullLobby;
  }

  async toggleReady(userId: string, lobbyPinId: string) {
    const [lobbyMemberList, lobbyData, isUserInLobby] = await Promise.all([
      this.getLobbyMemberList(lobbyPinId),
      this.getLobbyFull(lobbyPinId),
      this.userRedisService.isUserInLobby(userId, lobbyPinId),
    ]);

    if (lobbyData.details.roomStatus !== LobbyRoomStatus.WAITING) {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "lobby must be in waiting status to be able to press ready",
      );
    }

    if (isUserInLobby === false) {
      throw errorWithCode(HttpStatus.FORBIDDEN, "must be in the lobby to press ready button");
    }

    if (lobbyMemberList.playerList.includes(userId) === false) {
      throw errorWithCode(HttpStatus.FORBIDDEN, "user must be player to press ready");
    }

    if (userId === lobbyData.details.hostUserId) {
      throw errorWithCode(HttpStatus.FORBIDDEN, "host can start game, but cannot press ready button");
    }

    if (lobbyMemberList.readyPlayerList.includes(userId)) {
      await this.redis.srem(redis_lobby_ready_player_list(lobbyPinId), userId);
      return false;
    } else {
      await this.redis.sadd(redis_lobby_ready_player_list(lobbyPinId), userId);
      return true;
    }
  }

  async startGameRoom(lobbyPinId: string): Promise<LobbyDto> {
    const [lobbyData, lobbyMemberList] = await Promise.all([
      this.getLobbyFull(lobbyPinId),
      this.getLobbyMemberList(lobbyPinId),
    ]);

    if (lobbyData.details.roomStatus !== LobbyRoomStatus.WAITING) {
      throw errorWithCode(HttpStatus.FORBIDDEN, "the lobby must be in waiting state to start a game");
    }

    if (lobbyMemberList.playerList.length < 2) {
      throw errorWithCode(HttpStatus.FORBIDDEN, "at least 2 players are required to start a poker game");
    }

    const readySet = new Set(lobbyMemberList.readyPlayerList);
    const allPlayersReady = lobbyMemberList.playerList.every(
      (playerId) => playerId === lobbyData.details.hostUserId || readySet.has(playerId),
    );

    if (!allPlayersReady) {
      throw errorWithCode(HttpStatus.FORBIDDEN, "all players must be ready to start a poker game");
    }

    await this.setLobbyRoomStatus(lobbyPinId, LobbyRoomStatus.UNAVAILABLE);

    try {
      const res = await this.gameGatewayService.startHand(lobbyPinId);

      await this.redis
        .pipeline()
        .hset(redis_lobby_details(lobbyPinId), "gameRoomId", res.tableSessionId)
        .del(redis_lobby_ready_player_list(lobbyPinId))
        .exec();

      await this.setLobbyRoomStatus(lobbyPinId, LobbyRoomStatus.PLAYING);
      this.lobbyGatewayService.gameStarted(lobbyPinId, res.tableSessionId);
      return this.getLobbyFull(lobbyPinId);
    } catch (error) {
      await this.setLobbyRoomStatus(lobbyPinId, LobbyRoomStatus.WAITING).catch(() => null);
      throw error;
    }
  }

  async isLobbyExist(lobbyPinId: string) {
    const res = await this.redis.sismember(redis_lobby_global_details_lobby_lists(), lobbyPinId);
    return res !== 0;
  }
}
