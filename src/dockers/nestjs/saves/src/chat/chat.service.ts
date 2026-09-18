import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type { DrizzleDB } from '../drizzle/types/drizzle.js';
import { chat_rooms } from '../drizzle/schema/chat_rooms.schema.js';
import { chat_room_members } from '../drizzle/schema/chat_room_members.schema.js';
import { eq } from 'drizzle-orm';
import { chat_messages } from '../drizzle/schema/chat_messages.schema.js';

@Injectable()
export class ChatService {

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB
  ) {}

  
  async findAllJoinedChatRoom(userId: string) {

    return await this.db
      .select({
        id: chat_rooms.id,
        roomName: chat_rooms.roomName,
        type: chat_rooms.type,
        createdAt: chat_rooms.createdAt,
        role: chat_room_members.role,
        joinedAt: chat_room_members.joinedAt,
      })
      .from(chat_rooms)
      .innerJoin(
        chat_room_members,
        eq(chat_rooms.id, chat_room_members.chatRoomId),
      )
      .where(eq(chat_room_members.userId, userId));
  }

  async getChatMessages(userId: string, chatRoomId: string, limit = 50) {

    //await this.db
    //  .select({
    //    id: chat_messages.id,
    //    userId: chat_messages.userId,
    //    messageText: chat_messages.messageText,
    //    createdAt: chat_messages.createdAt
    //  })
    //  .from(chat_messages)

  }
}
