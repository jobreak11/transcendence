import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, InternalServerErrorException, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ZodValidationPipe } from '../pipes/ZodValidationPipe.js';
import { UserThrottlerGuard } from '../auth/guards/user-throttler/user-throttler.guard.js';
import { Throttle } from '@nestjs/throttler';
import { THROTTLER_CHAT_CONTROLLER_LIMIT, THROTTLER_CHAT_CONTROLLER_TTL } from '../constant.js';
import { CreateChatRoomSchema, InviteUserToChatRoomSchema, KickUserChatRoomSchema } from './dtos/chat.dto.js';
import type { CreateChatRoomZodDto, InviteUserToChatRoomZodDto, KickUserChatRoomZodDto } from './dtos/chat.dto.js';
import { ChatService } from './chat.service.js';

@UseGuards(JwtAuthGuard, UserThrottlerGuard)
@Throttle({
  default: {
    limit: THROTTLER_CHAT_CONTROLLER_LIMIT,
    ttl: THROTTLER_CHAT_CONTROLLER_TTL
  }
})
@ApiBearerAuth()
@Controller('chat')
export class ChatController {

  constructor(
    private readonly chatService: ChatService
  ) {}

  @Get()
  // retrieve all the chat room this user can join
  getAllUserRoom(@Req() req:any) {
    return this.chatService.findAllChatRooms(req.user.id);
  }

  @Post('dm')
  dmUser(@Req() req:any, @Query('targetUserId') targetUserId:string) {

    // return the chatRoomId for websocket in client side to listen to

    if (req.user.id === targetUserId) {
      throw new BadRequestException('cannot establish direct message room to your self');
    }

    return this.chatService.directMessageRoom(req.user.id, targetUserId)
  }

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


  @HttpCode(HttpStatus.CREATED)
  @Post('room/create')
  async createChatRoom(@Req() req:any, 
    @Body(new ZodValidationPipe(CreateChatRoomSchema)) body: CreateChatRoomZodDto) {

    const res = await this.chatService.createRoom(req.user.id, body.type, body.roomName);
    if (!res) 
      throw new InternalServerErrorException("Cannot create the chat room.");

    return res;
  }


  @HttpCode(HttpStatus.OK)
  @Post('room/invite')
  inviteToChatRoom(@Req() req:any, 
  @Body(new ZodValidationPipe(InviteUserToChatRoomSchema)) body: InviteUserToChatRoomZodDto) {

    return this.chatService.inviteToRoom(req.user.id, body.targetUserId, body.chatRoomId, body.role);
  }


  @HttpCode(HttpStatus.OK)
  @Post('room/leave')
  leaveTheChatRoom(@Req() req:any,
    @Query('chatRoomId', new ParseUUIDPipe()) chatRoomId: string
  ) {
    return this.chatService.leaveChatRoom(req.user.id, chatRoomId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('room/kick')
  kickUserChatRoom(@Req() req: any,
    @Body(new ZodValidationPipe(KickUserChatRoomSchema)) body: KickUserChatRoomZodDto
  ) {
    return this.chatService.kickUserChatRoom(req.user.id, body.targetUserId, body.chatRoomId);
  }


}
