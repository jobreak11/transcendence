import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.provider.js';
import type { RedisClient } from '../../redis/redis.provider.js';
import * as crypto from 'node:crypto'
import { CreateLobbyDto, LobbyRoomType } from './dto/create-lobby.dto.js';
import { LobbyDto, LobbyRoomStatus } from './dto/lobby.dto.js';
import { GetLobbyMemberListDto } from './dto/get-lobby-member-list.dto.js';
import { GameSettingFormat, GameSettingsDto } from './dto/game-settings.dto.js';
import { ResponseLobbyDto } from './dto/response-lobby.dto.js';
import { UpdateLobbyDto } from './dto/update-lobby.dto.js';
import { keyof, map, record, string } from 'zod';
import { groupSrvRecords } from 'ioredis/built/cluster/util.js';
import { LOBBY_ROOM_MAX } from './lobby.constants.js';
import { redis_user_game_lobby } from '../../redis/user-redis/namespaces/user.namespace.js';
import { redis_lobby_all_keys, redis_lobby_game_settings, redis_lobby_general_settings, redis_lobby_global_details_lobby_lists, redis_lobby_player_member_list, redis_lobby_spectator_member_list } from '../../redis/lobby-redis/namespaces/lobby.namespace.js';
import { ChatGatewayService } from '../../websocket/main-gateway/chat-gateway/chat-gateway.service.js';
import { ASYNC_METHOD_SUFFIX, DEFAULT_METHOD_KEY } from '@nestjs/common/module-utils/constants.js';
import { LobbyRedisService } from '../../redis/lobby-redis/lobby-redis.service.js';

@Injectable()
export class LobbyService implements OnModuleInit {

  private readonly logger = new Logger(LobbyService.name);

  constructor(
    private readonly chatGatewayService: ChatGatewayService,
    private readonly lobbyRedisService: LobbyRedisService,

  ) {
  }

  generateNewLobbyPinId(): string {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');

  }



  async createLobby(creatorUserId: string, createLobbyDto: CreateLobbyDto): Promise<LobbyDto> {
  /*
    Create a lobby which would live in redis not in database
    NOTE:
     - Assuming you must already check
  */

    // must check first that this user must not already in some lobby

    // each lobby in the set identify by 

    // 1. check the limit of the lobby room allowed
    //  - if the room is already on the max amount it should 
    //    throw to notify the user that it is not possible to 
    //    create new lobby a the moment

    // 2. if lobby count still isn't reach the limit yet,
    //    should try to insert new room to the lobby list
    //    until success or if not success with some amount of time should
    //    throw internal error and notify the weird scenario.
    

    let redisInsertRes: number = 0;
    let newLobbyPinIdString: string = this.generateNewLobbyPinId()
    // to max amout of time to try insert random value
    for (let i: number = 0; i < 10; i++) {

      redisInsertRes = await this.redis.lobbyRoomCreate(
        redis_user_game_lobby(creatorUserId),
        redis_lobby_global_details_lobby_lists(),
        LOBBY_ROOM_MAX,
        newLobbyPinIdString,
      )
      //redisInsertRes = await this.redis.sadd(
      //  LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS,
      //  newLobbyPinIdString
      //);

      if (redisInsertRes !== 3) {
        // insertion success full with the random pin id
        break ;
      }
      newLobbyPinIdString = this.generateNewLobbyPinId();
    }


    if (redisInsertRes !== 0) {
      if (redisInsertRes === 1) {
        // 1 means the user is already in a lobby room
        // if already in lobby should not allowed to create new lobby
        throw new ForbiddenException("user already existed in lobby and not allowed to create new one.")
      }
      else if (redisInsertRes === 2) {
        throw new ServiceUnavailableException("max lobby room number reached. try again later");
      }
      else if (redisInsertRes === 3) {
        // failed to insert in the given retries
        this.logger.error({
          message: "error from createLobby()",
          error: "cannot insert new lobby room within the given retires"
        });
        throw new InternalServerErrorException("unknown error");
      }
      else {
        // idk wtf
        this.logger.error({
          message: "error from createLobby, redis custom function failed",
        })
        throw new InternalServerErrorException("unknown error");
      }
    }

    const newLobbyDto: LobbyDto = {
      roomPinId: newLobbyPinIdString,
      catchPhrase: createLobbyDto.catchPhrase,
      roomType: createLobbyDto.roomType,
      password: createLobbyDto.password,
      createdByUserId: creatorUserId,
      hostUserId: creatorUserId,
      createdAt: new Date(),
      roomStatus: LobbyRoomStatus.WAITING,
      currentPlayerCount: 1, // add the current creator added to join the lobby room
      currentSpectatorCount: 0,
      gameSettings: createLobbyDto.gameSettings,
    }

    const record = this.lobbySettingsRecord(newLobbyDto);

    // now the lobby is created and on the set we can
    const allRes = await this.redis
      .pipeline()
      .hset(
        redis_lobby_general_settings(newLobbyPinIdString),
        record.generalSettingsRecord
      )
      .hset(
        redis_lobby_game_settings(newLobbyPinIdString), 
        record.gameSettingsRecord
      )
      .zadd(
        redis_lobby_player_member_list(newLobbyPinIdString),
        new Date().getTime(),
        creatorUserId
      )
      .set(
        redis_user_game_lobby(creatorUserId),
        newLobbyPinIdString
      )
      .exec();

    if (!allRes) {
      // 
      this.logger.error({
        message: "from createLobby()",
        error: "redis pipeline error",
      });

      throw new InternalServerErrorException("unknown error");
    }

    await this.chatGatewayService.joinLobbyChat(creatorUserId, newLobbyPinIdString);

    return newLobbyDto;

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
        throw new NotFoundException("the lobby is not exist");
      }
      else if (res === 2) {
        throw new ConflictException("the lobby is already on the set state");
      }
      else {
        this.logger.error({
          message: "error from setLobbyRoomStatus",
          res: res,
        })
        throw new InternalServerErrorException("unknown error");
      }
    }
  }

  async destroyLobbyRoom(lobbyPinId: string) {

    await this.setLobbyRoomStatus(lobbyPinId, LobbyRoomStatus.UNAVAILABLE);

    // iterately leave all teh user one by one
    const allMember = await this.getLobbyMemberList(lobbyPinId);

    for (const playerUserId of allMember.playerList) {
      await this.leaveLobby(playerUserId, lobbyPinId);
    }

    for (const spectatorUserId of allMember.spectatorList) {
      await this.leaveLobby(spectatorUserId, lobbyPinId);
    }

  }

  // only host can kick the user out
  async kickLobbyMember(hostUserId: string, toKickUserId: string) {

    const lobbyPinId = await this.redis.get(redis_user_game_lobby(hostUserId));
    
    if (!lobbyPinId) {
      throw new ForbiddenException("user must be in the room")
    }

    const realHostUserId = await this.redis.hget(redis_lobby_general_settings(lobbyPinId), 'hostUserId');

    if (!realHostUserId) {
      throw new NotFoundException("lobby room not found");
    }

    if (realHostUserId !== hostUserId) {
      throw new ForbiddenException("this user is not the host of the lobby");
    }

    if (hostUserId === toKickUserId)
      throw new ForbiddenException("cannot kick yourself out");

    const res = await this.leaveLobby(toKickUserId, lobbyPinId);



  }

  async leaveLobbyUser(leaveUserId: string) {
    // the current user wants to leave their current room

    // have the current lobby room that user is currently in first
    const lobbyPinId = await this.redis.get(redis_user_game_lobby(leaveUserId));
    
    if (!lobbyPinId) {
      throw new ForbiddenException("user cannot leave if not in a lobby room")
    }

    const res = await this.leaveLobby(leaveUserId, lobbyPinId);
    if (res !== 0) {
      if (res === 1) {
        throw new NotFoundException("not in the lobby room / lobby not found")
      }
      else if (res === 2) {
        throw new NotFoundException("user is not in the room");
      }
      else if (res === 3) {
        throw new ForbiddenException("lobby pin Id given and what user own is mismatched")
      }
      else {
        this.logger.error({
          message: "error from leaveLobbyUser()",
          return: res
        })

        throw new InternalServerErrorException("unknown error");
      }
    }

    

  }

  private async leaveLobby(leaveUserId: string, lobbyPinId: string) {
  // leave lobby NOTE: this 

    try {

      const res = await this.redis.lobbyRoomLeave(
        redis_lobby_player_member_list(lobbyPinId),
        redis_lobby_spectator_member_list(lobbyPinId),
        redis_lobby_global_details_lobby_lists(),
        redis_user_game_lobby(leaveUserId),
        redis_lobby_general_settings(lobbyPinId),
        redis_lobby_game_settings(lobbyPinId),
        leaveUserId,
        lobbyPinId
      );

      await this.chatGatewayService.leaveLobbyChat(leaveUserId, lobbyPinId);

      return res;

    } catch (error: any) {
      this.logger.error({
        message: "error from leaveLobby",
        error: error
      })

      throw new InternalServerErrorException("unknown error");
    }

  }

  async removeLobby(lobbyPinId: string) {

    // NOTE: please check if all use rin the lobby room already leave the room.

    const memberList = await this.getLobbyMemberList(lobbyPinId);

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
      this.logger.error({
        message: "error from removeLobby()",
        error: "redis pipeline error"
      });

      throw new InternalServerErrorException("unknown error")
    }

    return res;
  }

  async joinLobby(
    lobbyPinId: string,
    toJoinUserId: string,
    isSpectator: boolean = false,
    lobbyPassword?: string, 
  ) {

    try {

      const res = await this.redis.lobbyRoomJoin(
        redis_user_game_lobby(toJoinUserId),
        redis_lobby_global_details_lobby_lists(),
        redis_lobby_spectator_member_list(lobbyPinId),
        redis_lobby_player_member_list(lobbyPinId),
        redis_lobby_game_settings(lobbyPinId),
        redis_lobby_general_settings(lobbyPinId),
        isSpectator ? "true" : "false",
        toJoinUserId,
        lobbyPassword ?? "",
        lobbyPinId,
        new Date().getTime().toString()
      );

      if (res !== 0) {
        // not 0 mean error occured

        if (res === 1) {
          throw new ForbiddenException("cannot join if user is already in a lobby room");
        }
        else if (res === 2) {
          throw new ForbiddenException("cannot join to the room user already in");
        }
        else if (res === 3) {
          throw new ForbiddenException("the room is full. try again later");
        }
        else if (res == 4) {
          throw new ForbiddenException("wrong password to enter the lobby room")
        }
        else if (res === 5) {
          throw new NotFoundException("the target Lobby is not found");
        }
        else if (res === 6) {
          throw new ForbiddenException("the lobby room is currently unavailable to join")
        }
        else if (res === 7) {
          throw new ForbiddenException("lobby room is playing and cannot join as player yet");
        }
        else {
          this.logger.error({
            message: "error from joinLobby()",
            res: res
          })

          throw new InternalServerErrorException("unknown error");
        }

      }

      // after joining lobby it would create new lobby chat room
      await this.chatGatewayService.joinLobbyChat(toJoinUserId, lobbyPinId);

      return await this.getLobbyDto(lobbyPinId);


    } catch (error: any) {

      // catch the error if lua script i did somrthing wrong

      this.logger.error({
        message: "error from joinLobby",
        error: error
      });

      throw new InternalServerErrorException("unknown error");
    }

  }

  // get the userId list of both player and spectator
  // of the target lobby
  async getLobbyMemberList(lobbyPinId: string): Promise<GetLobbyMemberListDto> {

    const allRes = await this.redis
      .pipeline()
      .sismember(
        redis_lobby_global_details_lobby_lists(),
        lobbyPinId
      )
      .zrange(redis_lobby_player_member_list(lobbyPinId), "0", "-1")
      .zrange(redis_lobby_spectator_member_list(lobbyPinId), "0", "-1")
      .exec();

    if (!allRes) {
      this.logger.error({
        message: "error from joinLobby",
        error: "redis pipeline error"
      });

      throw new InternalServerErrorException("unknown error");
    }

    for (const [err] of allRes) {
      if (err) {
        this.logger.error({
          message: "error from getLobbyMemberList",
          error: err
        })
        throw new InternalServerErrorException("unknown error");
      }
    }

    const [
      [, isMember],
      [, rawPlayerList],
      [, rawSpectatorList],
    ] = allRes as [
      [null, number],
      [null, string[]],
      [null, string[]],
    ];

    if (isMember !== 1) {
      throw new NotFoundException(`lobby room ${lobbyPinId} is not found`);
    }

    return {
      playerList: rawPlayerList,
      spectatorList: rawSpectatorList,
    };

  }

  async getLobbyDto(lobbyPinId: string): Promise<LobbyDto> {

    const allRes = await this.redis
      .pipeline()
      .sismember(
        redis_lobby_global_details_lobby_lists(),
        lobbyPinId
      )
      .hgetall(
        redis_lobby_general_settings(lobbyPinId),
      )
      .hgetall(
        redis_lobby_game_settings(lobbyPinId),
      )
      .zcard(
        redis_lobby_player_member_list(lobbyPinId),
      )
      .zcard(
        redis_lobby_spectator_member_list(lobbyPinId),

      )
      .exec();

    if (!allRes) {
      this.logger.error({
        message: "error from joinLobby",
        error: "redis pipeline error"
      });

      throw new InternalServerErrorException("unknown error");
    }

    const [
      [existErr, isMember],
      [generalErr, rawGeneralSettings],
      [gameErr, rawGameSettings],
      [playerCountError, rawPlayerCount],
      [spectatorCountError, rawSpectatorCount]
    ] = allRes as [
      [Error | null, number],
      [Error | null, Record<string, string>],
      [Error | null, Record<string, string>],
      [Error | null, number],
      [Error | null, number],
    ]

    if (existErr) {
      this.logger.error({
        message: "error from getLobbyDto",
        error: existErr
      })
      throw new InternalServerErrorException("unknown error");
    }

    if (isMember !== 1) {
      throw new NotFoundException(`lobby room ${lobbyPinId} is not found`);
    }

    if (generalErr) {
      this.logger.error({
        message: "error from getLobbyDto",
        error: generalErr
      })
      throw new InternalServerErrorException("unknown error");
    }
    if (gameErr) {
      this.logger.error({
        message: "error from getLobbyDto",
        error: gameErr
      })
      throw new InternalServerErrorException("unknown error");
    }
    if (playerCountError) {
      this.logger.error({
        message: "error from getLobbyDto",
        error: playerCountError
      })
      throw new InternalServerErrorException("unknown error");
    }
    if (spectatorCountError) {
      this.logger.error({
        message: "error from getLobbyDto",
        error: spectatorCountError
      })
      throw new InternalServerErrorException("unknown error");
    }

    const lobbyDto: LobbyDto = {
      roomPinId: rawGeneralSettings.roomPinId,
      roomType: rawGeneralSettings.roomType as LobbyRoomType,
      hostUserId: rawGeneralSettings.hostUserId,
      createdByUserId: rawGeneralSettings.createdByUserId,
      catchPhrase: rawGeneralSettings.catchPhrase ? rawGeneralSettings.catchPhrase : null,
      password: rawGeneralSettings.password ? rawGeneralSettings.password : null,
      createdAt: new Date(rawGeneralSettings.createdAt),
      roomStatus: rawGeneralSettings.roomStatus as LobbyRoomStatus,
      currentPlayerCount: rawPlayerCount,
      currentSpectatorCount: rawSpectatorCount,
      gameSettings: {
        maxPlayer: Number(rawGameSettings.maxPlayer),
        maxSpectator: Number(rawGameSettings.maxSpectator),
        format: rawGameSettings.format as GameSettingFormat
      }
    }

    return lobbyDto;
  }


  async findOne(lobbyPinId: string): Promise<ResponseLobbyDto> {

    const lobbyDto = await this.getLobbyDto(lobbyPinId);
    
    return {
      roomPinId: lobbyDto.roomPinId,
      createdAt: lobbyDto.createdAt,
      catchPhrase: lobbyDto.catchPhrase,
      roomStatus: lobbyDto.roomStatus,
      roomType: lobbyDto.roomType,
      hostUserId: lobbyDto.hostUserId,
      currentPlayerCount: lobbyDto.currentPlayerCount,
      currentSpectatorCount: lobbyDto.currentSpectatorCount,
      gameSettings: lobbyDto.gameSettings,
    }
  }

  async findAll(): Promise<ResponseLobbyDto[]> {

    const allLobbyRoomPinId = await this.redis.smembers(redis_lobby_global_details_lobby_lists());

    if (allLobbyRoomPinId.length === 0) {
      return []
    }

    // create pipeline
    const pipeline = this.redis.pipeline();

    const lobbyAmount = allLobbyRoomPinId.length;

    const commandPerLobby = 4;
    for (const lobbyPinId of allLobbyRoomPinId) {
      pipeline.hgetall(redis_lobby_general_settings(lobbyPinId));
      pipeline.hgetall(redis_lobby_game_settings(lobbyPinId));
      pipeline.zcard(redis_lobby_player_member_list(lobbyPinId));
      pipeline.zcard(redis_lobby_spectator_member_list(lobbyPinId));
    }

    const allRes = await pipeline.exec();
    if (!allRes) {
      this.logger.error({
        message: "error from findAll",
        error: "redis pipeline error"
      });
      throw new InternalServerErrorException("unknown error");
    }

    const results: ResponseLobbyDto[] = [];

    for (let i = 0; i < lobbyAmount; i++) {
      const lobbyPinId = allLobbyRoomPinId[i];
      const baseIndex = i * commandPerLobby;

      const [generalErr, rawGeneralSettings] = allRes[baseIndex] as [Error | null, Record<string, string>];
      const [gameErr, rawGameSettings] = allRes[baseIndex + 1] as [Error | null, Record<string, string>];
      const [playerErr, rawPlayerCount] = allRes[baseIndex + 2] as [Error | null, number];
      const [spectatorErr, rawSpectatorCount] = allRes[baseIndex + 3] as [Error | null, number];

      if (generalErr || gameErr || playerErr || spectatorErr) {
      this.logger.warn(`Error fetching data for lobby ${lobbyPinId}`);
      }

      results.push({
        roomPinId: lobbyPinId,
        createdAt: new Date(rawGeneralSettings.createdAt),
        roomStatus: rawGeneralSettings.roomStatus as LobbyRoomStatus,
        catchPhrase: rawGeneralSettings.catchPhrase,
        roomType: rawGeneralSettings.roomType as LobbyRoomType,
        currentPlayerCount: rawPlayerCount,
        hostUserId: rawGeneralSettings.hostUserId,
        currentSpectatorCount: rawSpectatorCount,
        gameSettings: {
          format: rawGameSettings.format as GameSettingFormat,
          maxPlayer: parseInt(rawGameSettings.maxPlayer),
          maxSpectator: parseInt(rawGameSettings.maxSpectator),
        }
      })
    }

    return results;
  }

  private lobbySettingsRecord(lobbyDto: LobbyDto)
  : {
    generalSettingsRecord: Record<string,string>;
    gameSettingsRecord: Record<string,string>;
  } {

    const rawGeneralSettingsRecord = Object.fromEntries(
      Object.entries(lobbyDto)
        .filter(([key]) => key !== "gameSettings")
        .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : String(value ?? "")])
    )

    const rawGameSettingsRecord = Object.fromEntries(
      Object.entries(lobbyDto.gameSettings)
        .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : String(value ?? "")])
    )

    return {
      generalSettingsRecord: rawGeneralSettingsRecord,
      gameSettingsRecord: rawGameSettingsRecord,
    };
  }

  async update(hostUserId: string, body: UpdateLobbyDto): Promise<LobbyDto> {

    // check the update dto



    // update the details setting of the current room
    // the room status must be on WAITING only when update
    // only host can change the settings

    //get the lobby id the user is currently at
    const currentLobbyPinId = await this.redis.get(redis_user_game_lobby(hostUserId));

    if (!currentLobbyPinId) {
      throw new ForbiddenException("user must be in the lobby room to perform");
    }

    let lobbyDto = await this.getLobbyDto(currentLobbyPinId);

    if (hostUserId !== lobbyDto.hostUserId) {
      throw new ForbiddenException("must be host to update the lobby settings");
    }

    // perform checking the current state of lobby dto
    if (lobbyDto.roomStatus !== LobbyRoomStatus.WAITING) {
      throw new ForbiddenException("cannot modify lobby setting if the lobby is not waiting");
    }


    lobbyDto = {
      ...lobbyDto,
      ...body,
    };

    const records = this.lobbySettingsRecord(lobbyDto);

    const res = await this.redis.pipeline()
      .hset(redis_lobby_general_settings(currentLobbyPinId), records.generalSettingsRecord)
      .hset(redis_lobby_game_settings(currentLobbyPinId), records.gameSettingsRecord)
      .exec();

    return lobbyDto;
  }
}
