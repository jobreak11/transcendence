import { BadRequestException, Controller, ForbiddenException, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('dm')
  dmUser(@Req() req:any, @Query('targetUserId') targetUserId:string) {

    // return the chatRoomId for websocket in client side to listen to

    if (req.user.id === targetUserId) {
      throw new BadRequestException('cannot establish direct message room to your self');
    }

    return this.chatService.directMessageRoom(req.user.id, targetUserId)
  }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('message')
  async getMessagesRoom(@Req() req:any, @Query('chatRoomId') chatRoomId:string) {

    if (!chatRoomId)
      throw new BadRequestException('chatRoomId query parameter is required');

    const roomRes = await this.chatService.isUserInRoom(req.user.id, chatRoomId);

    if (!roomRes) {
      throw new ForbiddenException('User is not in the target chatroom');
    }
    
    return await this.chatService.getChatMessages(chatRoomId);
  }

}
