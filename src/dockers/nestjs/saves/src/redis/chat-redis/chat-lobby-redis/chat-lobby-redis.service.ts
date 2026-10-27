import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT } from "../../redis.provider.js";
import type { RedisClient } from "../../redis.provider.js";
import { ChatRedisService } from "../chat-redis.service.js";
import { v7 as uuidv7 } from 'uuid'
import { ChatRoomVisibilityType } from "../../../drizzle/schema/chat_rooms/chat_rooms.schema.js";
import { redis_chat_lobby_chat_room } from "./namespaces/chat-lobby-redis.namespaces.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";

@Injectable()
export class ChatLobbyRedisService {

  private readonly logger = new Logger(ChatLobbyRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly chatRedisService: ChatRedisService

  ) {

  }


  async createLobbyChatRoom(lobbyPinid: string) {
    
    const result = await this.chatRedisService.createChatRoom({
      id: uuidv7(),
      roomName: null,
      visibilityType: ChatRoomVisibilityType.PRIVATE,
      createdAt: new Date()
    })
    
    await this.redis.set(redis_chat_lobby_chat_room(lobbyPinid), result.id);

    return result;
  }

  async removeLobbyChatRoom(lobbyPinId: string) {

    // get the actual chat room

    const res = await this.redis.get(redis_chat_lobby_chat_room(lobbyPinId));

    if (!res) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "lobby chat room not found",
      );
    }

    return this.chatRedisService.removeRoom(res);
  }
}