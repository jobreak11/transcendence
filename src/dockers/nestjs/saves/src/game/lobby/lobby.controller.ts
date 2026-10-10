import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { LobbyService } from './lobby.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LobbyGuard } from './lobby.guard.js';
import { ZodValidationPipe } from '../../pipes/ZodValidationPipe.js';
import { CreateLobbyDto, CreateLobbySchema } from './dto/create-lobby.dto.js';
import { JoinLobbyDto, JoinLobbySchema } from './dto/join-lobby.dto.js';

@UseGuards(JwtAuthGuard, LobbyGuard, ThrottlerGuard)
@Controller('game/lobby')
export class LobbyController {
  constructor(
    private readonly lobbyService: LobbyService
  ) {
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  createLobbyRoom(
    @Req() req:any,
    @Body(new ZodValidationPipe(CreateLobbySchema)) body: CreateLobbyDto
  ) {

    return this.lobbyService.createLobby(req.user.id, body);
  }

  @Post('join')
  @HttpCode(HttpStatus.NO_CONTENT)
  async joinLobbyRoom(
    @Req() req:any,
    @Body(new ZodValidationPipe(JoinLobbySchema)) body: JoinLobbyDto
  ) {

    await this.lobbyService.joinLobby(body.lobbyPinId, req.user.id, body.isSpectator, body.password);
  }

  @Post('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveLobbyRoom(@Req() req:any) {

    await this.lobbyService.leaveLobbyUser(req.user.id);
  }

  // get all available lobby room
  @Get('allRooms')
  getAllLobbyRoom(@Req() req:any) {

  }

  @Patch('settings')
  updateGameSettings(@Req() req:any) {

  }



}
