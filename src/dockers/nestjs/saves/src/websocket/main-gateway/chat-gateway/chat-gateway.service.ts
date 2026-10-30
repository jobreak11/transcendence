import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import z from 'zod';
import { Server } from 'socket.io';
import { ChatService } from '../../../chat/chat.service.js';
import { WsException } from '@nestjs/websockets';
import { InstanceLinksHost } from '@nestjs/core/injector/instance-links-host.js';
import { ChatMessageType } from '../../../drizzle/schema/chat_messages/chat_messages.schema.js';
import { room_main_chat_lobby, room_main_chat_specific } from '../rooms/chat.room.js';
import { resourceLimits } from 'worker_threads';
import { ChatMessage } from './dtos/chat-message.dto.js';
import { room_main_private_user } from '../rooms/user.room.js';
import { REDIS_CLIENT } from '../../../redis/redis.provider.js';
import  type { RedisClient } from '../../../redis/redis.provider.js';
import { redis_lobby_global_details_lobby_lists } from '../../../redis/lobby-redis/namespaces/lobby.namespace.js';
import { errorWithCode } from '../../../utility/errorWithCode.js';
import { ChatPublicRedisService } from '../../../redis/chat-redis/chat-public-redis/chat-public-redis.service.js';
import { event_main_chat_message } from '../events/chat.event.js';

@Injectable()
export class ChatGatewayService {
  private readonly logger = new Logger(ChatGatewayService.name);
  private server: Server | null = null

  setServer(server: Server) {
    this.server = server;
  }

  constructor(
    private readonly chatService: ChatService,
    private readonly chatPublicRedisService: ChatPublicRedisService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {

  }

  async newChatMessage(payload: ChatMessage.MessageInsertZodDto) {
    const result = await ChatMessage.insertSchema.safeParseAsync(payload)

    if (result.success) {

      if (result.data.chatRoomId !== null) {
        const res = await this.chatService.writeMessage(
          result.data.chatRoomId,
          result.data.messageText,
          result.data.userId === null ? undefined : result.data.userId,
        )

        const response: ChatMessage.ResponseZodDto = {
          messageText: res.messageText,
          chatRoomId: result.data.chatRoomId,
          type: res.type,
          userId: res.userId,
          createdAt: res.createdAt
        }

        this.server?.to(room_main_chat_specific(result.data.chatRoomId))
          .emit(event_main_chat_message.to_client(), response);
        return response;
      }
      else {
        const res = await this.chatPublicRedisService.writeMessage({
          messageText: result.data.messageText,
          type: result.data.userId === null ? ChatMessageType.SYSTEM_MESSAGE : ChatMessageType.USER_MESSAGE,
          userId: result.data.userId,
          createdAt: new Date()
        })

        const response: ChatMessage.ResponseZodDto = {
          messageText: res.messageText,
          chatRoomId: result.data.chatRoomId,
          type: res.type,
          userId: res.userId,
          createdAt: res.createdAt
        }

        this.server?.emit(event_main_chat_message.to_client(), response);

        return response;
      }
    } 
    else {
      throw errorWithCode(
        HttpStatus.BAD_REQUEST,
        "invalid payload",
        z.treeifyError(result.error)
      )
    }
  }

}
