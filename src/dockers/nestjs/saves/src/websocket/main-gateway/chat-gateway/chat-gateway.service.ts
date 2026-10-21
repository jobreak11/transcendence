import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import z from 'zod';
import { Server } from 'socket.io';
import { ChatService } from '../../../chat/chat.service.js';
import { ChatRoomType } from '../../../drizzle/schema/chat_rooms/chat_rooms.schema.js';
import { WsException } from '@nestjs/websockets';
import { InstanceLinksHost } from '@nestjs/core/injector/instance-links-host.js';
import { ChatMessageType } from '../../../drizzle/schema/chat_messages/chat_messages.schema.js';
import { room_main_chat_lobby, room_main_chat_specific } from '../rooms/chat.room.js';
import { event_main_chat } from '../events/chat.event.js';
import { resourceLimits } from 'worker_threads';
import { ChatMessage } from './dtos/chat-message.dto.js';
import { room_main_private_user } from '../rooms/user.room.js';
import { REDIS_CLIENT } from '../../../redis/redis.provider.js';
import  type { RedisClient } from '../../../redis/redis.provider.js';
import { redis_lobby_global_details_lobby_lists } from '../../../redis/lobby-redis/namespaces/lobby.namespace.js';

@Injectable()
export class ChatGatewayService {
  private readonly logger = new Logger(ChatGatewayService.name);
  private server: Server | null = null

  setServer(server: Server) {
    this.server = server;
  }

  constructor(
    private readonly chatService: ChatService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {

  }

  async newChatMessage(payload: ChatMessage.MessageZodDto) {
    const result = await ChatMessage.messageSchema.safeParseAsync(payload)

    if (result.success) {

      if (result.data.roomType === ChatMessage.RoomType.SPECIFIC_ROOM) {
        const res = await this.chatService.writeSpecificRoomMessage(
          result.data.senderUserId ?? "",
          result.data.chatRoomId ?? "",
          result.data.message,
        )

        const response: ChatMessage.ResponseZodDto = {
            roomType: result.data.roomType,
            chatRoomId: res.chatRoomId,
            messageType: ChatMessageType.USER_MESSAGE,
            senderUserId: res.userId ?? "",
            message: result.data.message
        }

        this.server?.to(room_main_chat_specific(res.chatRoomId))
          .emit(event_main_chat.to_client(), response);

        return ;
      }
      else if (result.data.roomType === ChatMessage.RoomType.GLOBAL) {

        const res = await this.chatService.writePublicRoomMessage(
          result.data.senderUserId ?? "",
          result.data.roomType,
          result.data.message
        )
      }
    } 
    else {
      throw new WsException({
        status: false,
        message: "payload validation failed",
        errors: z.treeifyError(result.error)
      })
    }
  }

  async joinLobbyChat(toJoinUserId: string, lobbyPinId: string): Promise<boolean> {

    const isLobbyExist = await this.redis.sismember(redis_lobby_global_details_lobby_lists(), lobbyPinId);

    if (isLobbyExist === 0) {
      return false;
    }

    this.server?.in(room_main_private_user(toJoinUserId))
      .socketsJoin(lobbyPinId);
    
    return true;
  }

  async leaveLobbyChat(toJoinUserId: string, lobbyPinId: string): Promise<boolean> {

    const isLobbyExist = await this.redis.sismember(redis_lobby_global_details_lobby_lists(), lobbyPinId);

    if (isLobbyExist === 0) {
      return false;
    }

    this.server?.in(room_main_private_user(toJoinUserId))
      .socketsLeave(lobbyPinId);
    
    return true;
  }

}
