import { ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.provider.js';
import type { RedisClient } from '../../redis/redis.provider.js';
import { v7 as uuidv7 } from 'uuid'
import * as crypto from 'node:crypto'
import Redis from 'ioredis';
import { CreateLobbyDto, GameSettingFormat, LobbyDto, LobbyRoomType } from './dto/lobby.dto.js';
import { lobby_redis_game_settings, lobby_redis_general_settings, LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS, lobby_redis_player_member_list, lobby_redis_spectator_member_list, LOBBY_ROOM_MAX, user_game_lobby } from './lobby.constants.js';
import { NotFoundError } from 'rxjs';
import { LoginDto } from '../../auth/dto/login.dto.js';

@Injectable()
export class LobbyService {

  private readonly logger = new Logger(LobbyService.name);

  constructor(
    @Inject(REDIS_CLIENT) private redis: RedisClient
  ) {
  }

  generateNewLobbyPinId(): string {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  }

  async createLobby(creatorUserId: string, createLobbyDto: CreateLobbyDto) {
  /*
    Create a lobby which would live in redis not in database
    NOTE:
     - Assuming you must already check
  */

    // must check first that this user must not already in some lobby
    const checkUserLobbyRes = await this.redis.get(user_game_lobby(creatorUserId));
    if (checkUserLobbyRes) {
      // if already in lobby should not allowed to create new lobby
      throw new ForbiddenException("user already existed in lobby and not allowed to create new one.")
    }
    

    // each lobby in the set identify by 

    // 1. check the limit of the lobby room allowed
    //  - if the room is already on the max amount it should 
    //    throw to notify the user that it is not possible to 
    //    create new lobby a the moment
    const currentLobbyCount = await this.redis.scard("lobby:global_details:lobby_lists");
    if (currentLobbyCount >= LOBBY_ROOM_MAX) {
      throw new ServiceUnavailableException("max lobby room number reached. try again later");
    }

    // 2. if lobby count still isn't reach the limit yet,
    //    should try to insert new room to the lobby list
    //    until success or if not success with some amount of time should
    //    throw internal error and notify the weird scenario.
    
    let redisInsertRes: number = 0;
    let newLobbyPinIdString: string = this.generateNewLobbyPinId()
    // to max amout of time to try insert random value
    for (let i: number = 0; i < 10; i++) {

      redisInsertRes = await this.redis.sadd(
        LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS,
        newLobbyPinIdString
      );

      if (redisInsertRes === 1) {
        // insertion success full with the random pin id
        break ;
      }
    }
    if (redisInsertRes === 0) {
      // failed to insert in the given retries
      this.logger.error({
        message: "error from createLobby()",
        error: "cannot insert new lobby room within the given retires"
      });

      throw new InternalServerErrorException("unknown error");
    }

    const newLobbyDto: LobbyDto = {
      roomPinId: newLobbyPinIdString,
      catchPhrase: createLobbyDto.catchPhrase,
      roomType: createLobbyDto.roomType,
      password: createLobbyDto.password,
      createdByUserId: creatorUserId,
      hostUserId: creatorUserId,
      createdAt: new Date(),
      gameSettings: createLobbyDto.gameSettings,
      currentPlayerCount: 0,
      currentSpectatorCount: 0,
    }

    // now the lobby is created and on the set we can
    const allRes = await this.redis
      .pipeline()
      .hset(
        `lobby:${newLobbyPinIdString}:general_settings`,
        {
          roomPinId: newLobbyDto.roomPinId,
          catchPhrase: newLobbyDto.catchPhrase ?? '',
          roomType: newLobbyDto.roomType.toString(),
          password: newLobbyDto.password ?? '',
          createdByUserId: newLobbyDto.createdByUserId,
          hostUserId: newLobbyDto.hostUserId,
          createdAt: newLobbyDto.createdAt.toISOString(),
        }
      )
      .hset(
        `lobby:${newLobbyPinIdString}:game_settings`, 
        {
          format: newLobbyDto.gameSettings.format.toString(),
          maxPlayer: newLobbyDto.gameSettings.maxPlayer,
          maxSpectator: newLobbyDto.gameSettings.maxSpectator
        }
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

  }

  async removeLobby(lobbyPinId: string) {

    // NOTE: please check if all use rin the lobby room already leave the room.

    const res = await this.redis
      .pipeline()
      .srem(
        LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS,
        lobbyPinId
      )
      .del(
        lobby_redis_general_settings(lobbyPinId),
        lobby_redis_game_settings(lobbyPinId),
        lobby_redis_player_member_list(lobbyPinId),
        lobby_redis_spectator_member_list(lobbyPinId),
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

  async joinLobby(lobbyPinId: string, toJoinUserId: string, lobbyPassword?: string,
    isSpectator: boolean = false
  ) {

    const targetLobby = await this.getLobbyDto(lobbyPinId);




  }

  // get the userId list of both player and spectator
  // of the target lobby
  async getLobbyMemberList(lobbyPinId: string) {

    const allRes = await this.redis
      .pipeline()
      .sismember(
        LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS,
        lobbyPinId
      )
      .smembers(lobby_redis_player_member_list(lobbyPinId))
      .smembers(lobby_redis_spectator_member_list(lobbyPinId))
      .exec();

    if (!allRes) {
      this.logger.error({
        message: "error from joinLobby",
        error: "redis pipeline error"
      });

      throw new InternalServerErrorException("unknown error");
    }

  }

  async getLobbyDto(lobbyPinId: string): Promise<LobbyDto> {

    const allRes = await this.redis
      .pipeline()
      .sismember(
        LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS,
        lobbyPinId
      )
      .hgetall(
        lobby_redis_general_settings(lobbyPinId),
      )
      .hgetall(
        lobby_redis_game_settings(lobbyPinId),
      )
      .scard(
        lobby_redis_player_member_list(lobbyPinId),
      )
      .scard(
        lobby_redis_spectator_member_list(lobbyPinId),

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
      currentPlayerCount: Number(rawPlayerCount),
      currentSpectatorCount: Number(rawSpectatorCount),
      gameSettings: {
        maxPlayer: Number(rawGameSettings.maxPlayer),
        maxSpectator: Number(rawGameSettings.maxSpectator),
        format: rawGameSettings.format as GameSettingFormat
      }
    }

    return lobbyDto;
  }


  async isLobbyExist(lobbyPinId: string) {
    const isLobbyExist = await this.redis.sismember(
        LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS,
        lobbyPinId
    );
    return isLobbyExist === 1;
  }


}
