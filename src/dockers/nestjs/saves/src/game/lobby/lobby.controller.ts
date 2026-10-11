import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { LobbyService } from './lobby.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LobbyGuard } from './lobby.guard.js';
import { ZodValidationPipe } from '../../pipes/ZodValidationPipe.js';
import { CreateLobbyDto, CreateLobbySchema } from './dto/create-lobby.dto.js';
import { JoinLobbyDto, JoinLobbySchema } from './dto/join-lobby.dto.js';
import { UpdateLobbyDto, UpdateLobbySchema } from './dto/update-lobby.dto.js';
import { ApiOperation } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, LobbyGuard, ThrottlerGuard)
@Controller('game/lobby')
export class LobbyController {
  constructor(
    private readonly lobbyService: LobbyService
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
    @Body(new ZodValidationPipe(CreateLobbySchema)) body: CreateLobbyDto
  ) {

    return this.lobbyService.createLobby(req.user.id, body);
  }

  @ApiOperation({
    summary: "user join the lobby room",
    description: "user must not in any room"
  })
  @Post('join')
  @HttpCode(HttpStatus.NO_CONTENT)
  async joinLobbyRoom(
    @Req() req:any,
    @Body(new ZodValidationPipe(JoinLobbySchema)) body: JoinLobbyDto
  ) {

    await this.lobbyService.joinLobby(body.lobbyPinId, req.user.id, body.isSpectator, body.password);
  }

  @ApiOperation({
    summary: "user leave the lobby room",
    description: "user must in a lobby room to leave"
  })
  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveLobbyRoom(@Req() req:any) {

    await this.lobbyService.leaveLobbyUser(req.user.id);
  }

  @ApiOperation({
    summary: "get all lobby rooms details",
    description: "get all details of the lobby room"
  })
  @Get('allRooms')
  getAllLobbyRoom(@Req() req:any) {
  // get all available lobby room

    return this.lobbyService.findAll();

  }

  @ApiOperation({
    summary: "update the setting of the lobby room",
    description: "user must be the host of the room"
  })
  @Patch('update')
  updateGameSettings(
    @Req() req:any,
    @Body(new ZodValidationPipe(UpdateLobbySchema)) body: UpdateLobbyDto
  ) {
    return this.lobbyService.update(req.user.id, body);
  }
}
