import { Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LobbyService } from './lobby.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LobbyGuard } from './lobby.guard.js';

@UseGuards(JwtAuthGuard, LobbyGuard, ThrottlerGuard)
@Controller('game/lobby')
export class LobbyController {
  constructor(
    private lobby: LobbyService
  ) {
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  createLobbyRoom(@Req() req:any) {
    
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
