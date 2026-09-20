import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service.js';

@Controller('chat')
export class ChatController {

  constructor(
    private readonly chatService: ChatService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  // retrieve all the chat room this user can join
  getAllUserRoom(@Req() req:any) {
    return this.chatService.findAllJoinedChatRoom(req.user.id);
  }

}
