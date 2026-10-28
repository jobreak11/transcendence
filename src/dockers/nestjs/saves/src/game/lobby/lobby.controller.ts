import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { LobbyService } from './lobby.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LobbyGuard } from './lobby.guard.js';
import { ZodValidationPipe } from '../../pipes/ZodValidationPipe.js';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LobbyCreate } from '../../redis/lobby-redis/schemas/lobby-create.redis.schema.js';
import { JoinLobbyDto } from './dto/join-lobby.dto.js';
import { joinLobbySchema } from './schemas/join-lobby.schema.js';
import z from 'zod';
import { lobbyUpdateSchema } from '../../redis/lobby-redis/schemas/lobby-update.redis.schema.js';
import { httpControllerCatch } from '../../utility/httpControllerCatch.js';
import { GetLobbyPublicDto } from './dto/get-lobby-public.dto.js';
import { UserRedisService } from '../../redis/user-redis/user-redis.service.js';
import { IsStrongPassword } from 'class-validator';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, LobbyGuard, ThrottlerGuard)
@Controller('game/lobby')
export class LobbyController {
  constructor(
    private readonly lobbyService: LobbyService,
    private readonly userRedisService: UserRedisService
  ) {
  }

  @ApiOperation({
    summary: "create a lobby room",
    description: "user create a new lobby room. Must not currently in another lobby room."
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  createLobbyRoom(
    @Req() req:any,
    @Body(new ZodValidationPipe(LobbyCreate.schema.input)) body: LobbyCreate.InputDto
  ) {

    try {
      return this.lobbyService.createLobby(req.user.id, body);
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

      const formatted: GetLobbyPublicDto[] = allLobby.map((lobby): GetLobbyPublicDto => {

        const {password, ...publicGeneralSettings} = lobby.generalSettings;
        const {chatRoomId, ...publicDetails} = lobby.details;

        return {
          details: publicDetails,
          gameSettings: lobby.gameSettings,
          generalSettings: publicGeneralSettings
        };
      })

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
    summary: "update the setting of the lobby room",
    description: "user must be the host of the room"
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
}
