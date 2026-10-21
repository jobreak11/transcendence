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
import { ChatRoomVisibilityType } from '../drizzle/schema/chat_rooms/chat_rooms.schema.js';
import { httpControllerCatch } from '../utility/httpControllerCatch.js';
import { brotliDecompressSync } from 'node:zlib';
import { ChatRoomMemberRole } from '../drizzle/schema/chat_room_members/chat_room_members.schema.js';
import { UserTitleDto } from '../user/title/title.dto.js';

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
    try {
      return this.chatService.findAllChatRooms(req.user.id);
    } catch (error: any) {
      
      throw httpControllerCatch(error);
    }
  }

  @Post('dm')
  dmUser(@Req() req:any, @Query('targetUserId') targetUserId:string) {

    try {

      if (req.user.id === targetUserId) {
        throw new BadRequestException('cannot establish direct message room to your self');
      }
      return this.chatService.directMessageRoom(req.user.id, targetUserId)
      // return the chatRoomId for websocket in client side to listen to

    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }

  @Get('message')
  async getMessagesRoom(@Req() req:any, @Query('chatRoomId') chatRoomId:string) {

    try {
      if (!chatRoomId)
        throw new BadRequestException('chatRoomId query parameter is required');

      const result = await this.chatService.isUserInRoom(req.user.id, chatRoomId);

      if (!result) {
        throw new ForbiddenException('User is not in the target chatroom');
      }
    
      return await this.chatService.getMessages(chatRoomId);
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }


  @HttpCode(HttpStatus.CREATED)
  @Post('room/create')
  async createChatRoom(
    @Req() req:any, 
    @Body(new ZodValidationPipe(CreateChatRoomSchema)) body: CreateChatRoomZodDto
  ) {
    try {
      const res = await this.chatService.createNewChatRoom({
        roomName: body.roomName ?? null,
        isTemporary: false,
        createdByUserId: req.user.id as string,
        visibilityType: body.type
      });
      if (!res) 
        throw new InternalServerErrorException("Cannot create the chat room.");
      return res;
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }


  @HttpCode(HttpStatus.OK)
  @Post('room/invite')
  async inviteToChatRoom(@Req() req:any, 
  @Body(new ZodValidationPipe(InviteUserToChatRoomSchema)) body: InviteUserToChatRoomZodDto) {

    try {
      const roomDetails = await this.chatService.findOne(body.chatRoomId);
      const userMember = await this.chatService.isUserInRoom(body.chatRoomId, req.user.id);

      if (roomDetails.visibilityType === ChatRoomVisibilityType.DIRECT_MESSAGE) {
        throw new ForbiddenException("cannot invite ")
      }


      return this.chatService.inviteUserToChatRoom(body, req.user.id);
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }


  @HttpCode(HttpStatus.OK)
  @Post('room/leave')
  leaveTheChatRoom(@Req() req:any,
    @Query('chatRoomId', new ParseUUIDPipe()) chatRoomId: string
  ) {
    return this.chatService.leaveRoom(req.user.id, chatRoomId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('room/kick')
  kickUserChatRoom(@Req() req: any,
    @Body(new ZodValidationPipe(KickUserChatRoomSchema)) body: KickUserChatRoomZodDto
  ) {
    return this.chatService.kickUser(req.user.id, body.targetUserId, body.chatRoomId);
  }


}
