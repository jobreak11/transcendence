import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Logger, Patch, Post, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { InternalLobbyGuard } from "./internal-lobby.guard.js";
import { ThrottlerGuard } from "@nestjs/throttler";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { LobbyService } from "../../../modules/lobby/lobby.service.js";
import { UsersRedisService } from "../../../modules/user/redis/users-redis.service.js";
import { UserService } from "../../../modules/user/user.service.js";
import { GameSettingFormat, GameSettings } from "../../../modules/lobby/redis/schemas/lobby-gameSettings.redis.schema.js";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { LobbyUserCreateSchema } from "../../../modules/lobby/schemas/lobby-user-create.schema.js";
import { LobbyUserCreateDto } from "../../../modules/lobby/dto/lobby-user-create.dto.js";
import { httpControllerCatch } from "../../../utility/httpControllerCatch.js";
import { joinLobbySchema } from "../../../modules/lobby/schemas/join-lobby.schema.js";
import { JoinLobbyDto } from "../../../modules/lobby/dto/join-lobby.dto.js";
import { GetLobbyPublicDto, LobbyGeneralSettingsPublicDto } from "../../../modules/lobby/dto/get-lobby-public.dto.js";
import { GetLobbyMemberListPublicDto } from "../../../modules/lobby/dto/get-lobby-member-list-public.dto.js";
import { LobbyUpdateDto } from "../../../modules/lobby/redis/dtos/lobby-update.dto.js";
import { lobbyUpdateSchema } from "../../../modules/lobby/redis/schemas/lobby-update.redis.schema.js";
import z from "zod";
import { LobbyDto } from "../../../modules/lobby/redis/dtos/lobby.dto.js";
import { LobbyDetails } from "../../../modules/lobby/redis/schemas/lobby-details.redis.schema.js";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, InternalLobbyGuard, ThrottlerGuard)
@UseFilters(HttpAllExceptionsFilter)
@Controller('game/lobby')
export class InternalLobbyController {

  private readonly logger = new Logger(InternalLobbyController.name);

  constructor(
    private readonly lobbyService: LobbyService,
    private readonly userRedisService: UsersRedisService,
    private readonly userService: UserService
  ) {
  }

  @ApiOperation({
    summary: "get available lobby formats",
    description: "Returns the starting stack and big blind configured for each lobby format."
  })
  @Get('formats')
  getLobbyFormats() {
    const formats = [
      GameSettingFormat.BEGINNER,
      GameSettingFormat.PRO,
      GameSettingFormat.TURBO,
    ] as const;

    return formats.map((format) => ({
      format,
      startingChips: GameSettings.formatChips[format],
      bigBlind: GameSettings.formatBB[format],
    }));
  }

  @ApiOperation({
    summary: "create a lobby room",
    description: "Users may create or join up to five lobby rooms at a time."
  })
  //@ApiBody({
  //  type: LobbyUserCreateDto
  //})
  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  createLobbyRoom(
    @Req() req:any,
    @Body(new ZodValidationPipe(LobbyUserCreateSchema)) body: LobbyUserCreateDto
  ) {
    this.logger.log("game/lobby/create received");

    try {
      return this.lobbyService.createLobby(req.user.id, {
        details: {createdByUserId: req.user.id},
        generalSettings: body.generalSettings,
        gameSettings: body.gameSettings
      });
    } catch (error: any) {
      throw httpControllerCatch(error);

    }

  }

  @ApiOperation({
    summary: "user join the lobby room",
    description: "user must not in any room"
  })
  @Post('join')
  joinLobbyRoom(
    @Req() req:any,
    @Body(new ZodValidationPipe(joinLobbySchema)) body: JoinLobbyDto
  ) {
    this.logger.log(`game/lobby/join receive from user ${req.user.id}`)

    try {
      return this.lobbyService.joinLobby(body.lobbyPinId, req.user.id, body.isSpectator, body.password);
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }

  @ApiOperation({
    summary: "user leave the lobby room",
    description: "user must in a lobby room to leave"
  })
  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveLobbyRoom(@Req() req:any, @Query('lobbyPinId') lobbyPinId: string) {

    try {
      await this.lobbyService.leaveLobbyUser(req.user.id, lobbyPinId);
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }

  @ApiOperation({
    summary: "get all lobby rooms details",
    description: "get all details of the lobby room"
  })
  @Get('allRooms')
  async getAllLobbyRoom(@Req() req:any): Promise<GetLobbyPublicDto[]> {
  // get all available lobby room

    try {
      const [
        allLobby
      ] = await Promise.all([
        this.lobbyService.findAll()
      ])

      const formatted: GetLobbyPublicDto[] = await Promise.all(
        allLobby.map(async (lobby): Promise<GetLobbyPublicDto> => {

          const {password, ...publicGeneralSettings} = lobby.generalSettings;

          const pub: LobbyGeneralSettingsPublicDto = {
            catchPhrase: publicGeneralSettings.catchPhrase,
            roomType: publicGeneralSettings.roomType,
            hasPassword: password === null ? false : true
          }

          return {
            details: {
              ...lobby.details,
              hostDisplayName: await this.getHostDisplayName(lobby.details.hostUserId),
            },
            gameSettings: lobby.gameSettings,
            generalSettings: pub
          };
        }),
      );

      return formatted;
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }

  @Get('my-lobby')
  getMyLobby(@Req() req: any) {
    return this.lobbyService.allLobbyUser(req.user.id);
  }

  @ApiOperation({
    summary: "get the lobby player and spectator names",
    description: "Only members of the lobby can view its member list."
  })
  @ApiResponse({
    type: GetLobbyMemberListPublicDto
  })
  @Get('members')
  async getLobbyMembers(
    @Req() req: any,
    @Query('lobbyPinId') lobbyPinId: string
  ): Promise<GetLobbyMemberListPublicDto> {
    const isMember = await this.userRedisService.isUserInLobby(req.user.id, lobbyPinId);
    if (!isMember) {
      throw new ForbiddenException("must join the lobby to view its members");
    }

    const { playerList, spectatorList, readyPlayerList } =
      await this.lobbyService.getLobbyMemberList(lobbyPinId);

    const getDisplayNames = async (userIds: string[]) =>
      Promise.all(userIds.map(async (userId) => {
        const user = await this.userService.findOne(userId);
        return user.user_profile?.displayName?.trim() || user.tagId;
      }));

    return {
      playerList: await getDisplayNames(playerList),
      spectatorList: await getDisplayNames(spectatorList),
      readyPlayerList: await getDisplayNames(readyPlayerList),
    };
  }

  @ApiOperation({
    summary: "update the setting of the lobby room",
    description: "user must be the host of the room"
  })
  @ApiBody({
    type: LobbyUpdateDto
  })
  @Patch('update')
  updateGameSettings(
    @Req() req:any,
    @Body(new ZodValidationPipe(lobbyUpdateSchema)) body: z.infer<typeof lobbyUpdateSchema>
  ) {
    try {
      return this.lobbyService.update(req.user.id, body);
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }

  @ApiOperation({
    summary: "for the host to start the lobby game",
    description: "the user invoke this must be inside the target lobby, and also is the host of that lobby"
  })
  @ApiCreatedResponse({
    type: () => LobbyDto
  })
  @Post('startgame')
  startGame(
    @Req() req: any,
    @Query('lobbyPinId') lobbyPinId: string
  ) {
    try {
      return this.lobbyService.startgame(req.user.id, lobbyPinId)
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }

  @Get()
  async oneLobby(
    @Req() req: any,
    @Query('lobbyPinId') lobbyPinId: string
  ): Promise<GetLobbyPublicDto> {

    const lobbyData = await this.lobbyService.getLobbyDto(lobbyPinId);

    const {password, ...publicGeneralSettings} = lobbyData.generalSettings;
    // const {chatRoomId, ...publicDetails} = lobbyData.details;

    const pub: LobbyGeneralSettingsPublicDto = {
      catchPhrase: publicGeneralSettings.catchPhrase,
      roomType: publicGeneralSettings.roomType,
      hasPassword: password === null ? false : true
    }

    return {
      details: {
        ...lobbyData.details,
        hostDisplayName: await this.getHostDisplayName(lobbyData.details.hostUserId),
      },
      gameSettings: lobbyData.gameSettings,
      generalSettings: pub,
    }
  }

  private async getHostDisplayName(hostUserId: string | null): Promise<string> {
    if (!hostUserId) return "Unknown";

    const user = await this.userService.findOne(hostUserId);
    return user.user_profile?.displayName?.trim() || user.tagId;
  }


}