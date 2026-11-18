import { ForbiddenException, HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { LobbyRedisService } from "./redis/lobby-redis.service.js";
import { UsersRedisService } from "../user/redis/users-redis.service.js";
import { errorWithCode } from "../../utility/errorWithCode.js";
import { GetLobbyMemberListDto } from "./dto/get-lobby-member-list.dto.js";
import { LobbyCreate } from "./redis/schemas/lobby-create.redis.schema.js";
import { LobbyDto } from "./redis/dtos/lobby.dto.js";
import { LobbyRoomStatus } from "./redis/schemas/lobby-details.redis.schema.js";
import { LobbyUpdateDto } from "./redis/dtos/lobby-update.dto.js";
import { GameSettingFormat } from "./redis/schemas/lobby-gameSettings.redis.schema.js";
import { LobbyRoomType } from "./redis/schemas/lobby-generalSettings.redis.schema.js";
import { randomBytes } from "node:crypto";

@Injectable()
export class LobbyService implements OnModuleInit {

  private readonly logger = new Logger(LobbyService.name);

  constructor(
    private readonly lobbyRedisService: LobbyRedisService,
    private readonly userRedisService: UsersRedisService,

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

  async createRankedGame(playerIds: string[]) {
    if (
      playerIds.length !== 4
      || new Set(playerIds).size !== playerIds.length
      || playerIds.some((playerId) => !playerId)
    ) {
      throw new Error("A ranked game requires four distinct players.");
    }

    const hostUserId = playerIds[0];
    if (!hostUserId) {
      throw new Error("A ranked game requires a host player.");
    }
    const lobbyPassword = randomBytes(32).toString("hex");
    const lobby = await this.createLobby(hostUserId, {
      details: { createdByUserId: hostUserId },
      generalSettings: {
        catchPhrase: "RANKED",
        roomType: LobbyRoomType.RANKED,
        password: lobbyPassword,
      },
      gameSettings: {
        maxPlayer: 4,
        maxSpectator: 0,
        format: GameSettingFormat.PRO,
      },
    });

    try {
      for (const playerId of playerIds.slice(1)) {
        await this.joinLobby(lobby.details.roomPinId, playerId, false, lobbyPassword);
        await this.lobbyRedisService.toggleReady(playerId, lobby.details.roomPinId);
      }

      const startedLobby = await this.startgame(hostUserId, lobby.details.roomPinId);
      const tableSessionId = startedLobby.details.gameRoomId;
      if (!tableSessionId) {
        throw new Error("The ranked lobby started without a game table.");
      }

      return {
        lobbyPinId: startedLobby.details.roomPinId,
        tableSessionId,
      };
    } catch (error) {
      await this.removeLobby(lobby.details.roomPinId).catch((cleanupError: unknown) => {
        this.logger.error(
          "Failed to clean up an incomplete ranked lobby",
          cleanupError instanceof Error ? cleanupError.stack : String(cleanupError),
        );
      });
      throw error;
    }
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

    this.logger.debug("joinLobby called");

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

  update(lobbyPinId: string, updateInputDto: LobbyUpdateDto): Promise<LobbyDto> {
    return  this.lobbyRedisService.updateLobby(lobbyPinId, updateInputDto);
  }

  async startgame(userId: string, lobbyPinId: string): Promise<LobbyDto> {

    const [isUserinLobby, lobbyData] = await Promise.all([
      this.userRedisService.isUserInLobby(userId, lobbyPinId),
      this.lobbyRedisService.getLobbyFull(lobbyPinId)
    ])

    if (isUserinLobby === false) {
      throw new NotFoundException("user is not in the taret lobby");
    }

    if (lobbyData.details.hostUserId !== userId) {
      throw new ForbiddenException("user msut be the host of the lobby to start the game")
    }

    const res = await this.lobbyRedisService.startGameRoom(lobbyPinId);
    return res;
  }

}
