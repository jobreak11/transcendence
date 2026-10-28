import { BadRequestException, ConflictException, ForbiddenException, HttpStatus, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { redis_lobby_all_keys, redis_lobby_game_settings, redis_lobby_general_settings, redis_lobby_global_details_lobby_lists, redis_lobby_player_member_list, redis_lobby_spectator_member_list } from '../../redis/lobby-redis/namespaces/lobby.namespace.js';
import { ChatGatewayService } from '../../websocket/main-gateway/chat-gateway/chat-gateway.service.js';
import { LobbyRedisService } from '../../redis/lobby-redis/lobby-redis.service.js';
import { LobbyDto } from '../../redis/lobby-redis/dtos/lobby.dto.js';
import { LobbyRoomStatus } from '../../redis/lobby-redis/schemas/lobby-details.redis.schema.js';
import { LobbyCreate } from '../../redis/lobby-redis/schemas/lobby-create.redis.schema.js';
import { stat } from 'fs';
import { GetLobbyMemberListDto } from './dto/get-lobby-member-list.dto.js';
import { UserRedisService } from '../../redis/user-redis/user-redis.service.js';
import { errorWithCode } from '../../utility/errorWithCode.js';
import z from 'zod';
import { lobbyUpdateSchema } from '../../redis/lobby-redis/schemas/lobby-update.redis.schema.js';

@Injectable()
export class LobbyService implements OnModuleInit {

  private readonly logger = new Logger(LobbyService.name);

  constructor(
    private readonly chatGatewayService: ChatGatewayService,
    private readonly lobbyRedisService: LobbyRedisService,
    private readonly userRedisService: UserRedisService,

  ) {
  }

  onModuleInit() {
    
  }

  async createLobby(creatorUserId: string, createLobbyDto: LobbyCreate.InputDto): Promise<LobbyDto> {

    const res = await this.lobbyRedisService.lobbyCreate({
      details: {
        createdByUserId: creatorUserId
      },
      gameSettings: createLobbyDto.gameSettings,
      generalSettings: createLobbyDto.generalSettings
    })

    return res;
  }

  async setLobbyRoomStatus(lobbyPinId: string, status: LobbyRoomStatus) {
    await this.lobbyRedisService.setLobbyRoomStatus(lobbyPinId, status);
  }

  async destroyLobbyRoom(lobbyPinId: string) {

    await this.setLobbyRoomStatus(lobbyPinId, LobbyRoomStatus.UNAVAILABLE);

    await this.lobbyRedisService.lobbyRemove(lobbyPinId);
  }

  // only host can kick the user out
  async kickLobbyMember(hostUserId: string, toKickUserId: string, lobbyPinId: string) { 

    if (hostUserId === toKickUserId) {
      throw errorWithCode(
        HttpStatus.BAD_REQUEST,
        "host user id and kick user id cannot be the same"
      );
    }

    const [lobbyData, isHostInLobby, isKickInLobby] = await Promise.all([
      this.getLobbyDto(lobbyPinId),
      this.userRedisService.isUserInLobby(hostUserId, lobbyPinId),
      this.userRedisService.isUserInLobby(toKickUserId, lobbyPinId),
    ]);

    if (isHostInLobby === false) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "host is not in lobby"
      )
    }
    if (isKickInLobby === false) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "user to kick is not in lobby"
      )
    }

    if (lobbyData.details.hostUserId !== hostUserId) {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "must be host to kick the user"
      )
    }

    await this.lobbyRedisService.lobbyUserLeave(toKickUserId, lobbyPinId);

  }

  async leaveLobbyUser(leaveUserId: string, lobbyPinId: string) {

    await this.lobbyRedisService.lobbyUserLeave(leaveUserId, lobbyPinId);
    // the current user wants to leave their current room

    // have the current lobby room that user is currently in first
  }

  async removeLobby(lobbyPinId: string) {

    // NOTE: please check if all use rin the lobby room already leave the room.

    return this.lobbyRedisService.lobbyRemove(lobbyPinId);
  }

  joinLobby(
    lobbyPinId: string,
    toJoinUserId: string,
    isSpectator: boolean = false,
    lobbyPassword?: string, 
  ) {

    return this.lobbyRedisService.lobbyUserJoin(
      toJoinUserId,
      lobbyPinId,
      isSpectator,
      lobbyPassword
    )
  }

  // get the userId list of both player and spectator
  // of the target lobby
  getLobbyMemberList(lobbyPinId: string): Promise<GetLobbyMemberListDto> {
    return this.lobbyRedisService.getLobbyMemberList(lobbyPinId)
  }

  async getLobbyDto(lobbyPinId: string): Promise<LobbyDto> {

    const lobbyData = await this.lobbyRedisService.getLobbyFull(lobbyPinId)
    return lobbyData;
  }


  findOne(lobbyPinId: string): Promise<LobbyDto> {
    return this.getLobbyDto(lobbyPinId);
  }

  findAll(): Promise<LobbyDto[]> {

    return this.lobbyRedisService.getAllLobby();
  }

  // find all the lobby of this user 
  async allLobbyUser(userId: string) {

    const lobbyList = await this.userRedisService.getUserLobbyList(userId);

    if (lobbyList.length === 0) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "user not in any lobby"
      )
    }

    const promises = lobbyList.map((id) => {
      return this.findOne(id).catch(() => null);
    })

    const res = await Promise.all(promises);

    return (res.filter((value) => value !== null));
  }

  update(lobbyPinId: string, updateInputDto: z.input<typeof lobbyUpdateSchema>): Promise<LobbyDto> {
    return this.lobbyRedisService.updateLobby(lobbyPinId, updateInputDto);
  }

}
