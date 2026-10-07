import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LobbyService } from './lobby.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LobbyGuard } from './lobby.guard.js';
import { CreateLobbyDto, CreateLobbySchema } from './dto/lobby.dto.js';
import { ZodValidationPipe } from '../../pipes/ZodValidationPipe.js';

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
  joinLobbyRoom(@Req() req:any) {

  }

  @Post('leave')
  leaveLobbyRoom(@Req() req:any) {

  }

  // get all available lobby room
  @Get('allRooms')
  getAllLobbyRoom(@Req() req:any) {

  }

  @Patch('settings')
  updateGameSettings(@Req() req:any) {

  }



}
