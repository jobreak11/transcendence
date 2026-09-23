import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type { DrizzleDB } from '../drizzle/types/drizzle.js';
import { chat_rooms, ChatRoomType } from '../drizzle/schema/chat_rooms.schema.js';
import { chat_room_members, ChatRoomMemberRole } from '../drizzle/schema/chat_room_members.schema.js';
import { and, asc, desc, eq, ne, or } from 'drizzle-orm';
import { chat_messages, ChatMessageType } from '../drizzle/schema/chat_messages.schema.js';
import { char } from 'drizzle-orm/mysql-core';
import { alias } from 'drizzle-orm/pg-core';
import { throwIfEmpty } from 'rxjs';
import { join } from 'path';
import { id } from 'zod/v4/locales';

@Injectable()
export class ChatService {

  private readonly logger = new Logger(ChatService.name);

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

  getChatMessages(chatRoomId: string, limit = 50) {

    return this.db
      .select({
        chatMessageId: chat_messages.id,
        senderUserId: chat_messages.userId,
        messageText: chat_messages.messageText,
        createdAt: chat_messages.createdAt
      })
      .from(chat_messages)
      .where(
          eq(chat_messages.chatRoomId, chatRoomId)
      )
      .orderBy(asc(chat_messages.createdAt))
      .limit(limit);
  }

  getAllChatMessage(userId: string) {
    return  this.db
      .select({
        chatMessageId: chat_messages.id,
        senderUserId: chat_messages.userId,
        chatRoomId: chat_messages.chatRoomId,
        type: chat_messages.type,
        createdAt: chat_messages.createdAt
      })
      .from(chat_messages)
      .innerJoin(
        chat_room_members,
        and(
          eq(chat_messages.chatRoomId, chat_room_members.chatRoomId),
          eq(chat_room_members.userId, userId)
        )
      )
      .orderBy(
        asc(chat_messages.chatRoomId),
        desc(chat_messages.createdAt)
      )
  }

  async createRoom(creatorUserId: string, type?: ChatRoomType) {

    const [createdRoom] = await this.db
      .insert(chat_rooms)
      .values({
       type: type ?? ChatRoomType.PRIVATE
      })
      .returning()

    if (createdRoom) {
      await this.joinRoom(creatorUserId, createdRoom.id, ChatRoomMemberRole.OWNER);
    }

    return createdRoom;
  }

  async directMessageRoom(senderUserId: string, targetUserId:string) {

    if (senderUserId === targetUserId)
      throw new BadRequestException('Cannot establish direct message room to yourself');

    const member1 = alias(chat_room_members, 'm1');
    const member2 = alias(chat_room_members, 'm2');

    // find if found any direct message room first
    const [room] = await this.db
      .select(
        {
          chatRoomId: member1.chatRoomId,
        }
      )
      .from(member1)
      .innerJoin(member2, eq(member1.chatRoomId, member2.chatRoomId))
      .innerJoin(chat_rooms, eq(member1.chatRoomId, chat_rooms.id))
      .where(
        and(
          eq(chat_rooms.type, ChatRoomType.DIRECT_MESSAGE),
          eq(member1.userId, senderUserId),
          eq(member2.userId, targetUserId),
        ),
      )
    
    // if the room is not found yet need to create the new chat room
    if (room)
      return (room);

    console.debug("need to create room");

    const newRoom =  await this.createRoom(senderUserId, ChatRoomType.DIRECT_MESSAGE);

    if (newRoom) {
      await this.joinRoom(targetUserId, newRoom.id, ChatRoomMemberRole.OWNER)
      console.debug("joined on the member table");
      return newRoom;
    }
    else {
      return (null);
    }
  }

  async joinRoom(toJoinUserId: string, chatRoomId: string, role?: ChatRoomMemberRole) {

    // check first if user already exist in the room
    const chatRoomFound = await this.findChatRoom(chatRoomId);
    if (!chatRoomFound)
      return (null);

    const room = await this.isUserInRoom(toJoinUserId, chatRoomId);

    if (room) {
      // user found
      return (null);
    }

    const [ result ] = await this.db
      .insert(chat_room_members)
      .values({
        chatRoomId: chatRoomId,
        userId: toJoinUserId,
        role: role ?? ChatRoomMemberRole.MEMBER
      }
      )
      .returning();

    if (result) {
      this.logger.debug("insert chat room member success");
      await this.writeRoomSystemMessage(chatRoomId, `user ${toJoinUserId} just joined.`);
    }
    else {
      this.logger.debug("insert chat room member not found");

    }

    return (result);
  }

  async findChatRoom(chatRoomId: string) {
    const [ room ] = await this.db
      .select(
      )
      .from(chat_rooms)
      .where(
        eq(chat_rooms.id, chatRoomId)
      )
      .limit(1);

    return (room);
  }

  async isUserInRoom(userId: string, chatRoomId: string) {

    const [ room ] = await this.db
      .select(
      )
      .from(chat_room_members)
      .where(
        and(
          eq(chat_room_members.chatRoomId, chatRoomId),
          eq(chat_room_members.userId, userId)
        )
      )
      .limit(1);

    return room;
  }

  async writeRoomSystemMessage(chatRoomId: string, message: string) {

    const [result] = await this.db
      .insert(chat_messages)
      .values(
        {
          chatRoomId: chatRoomId,
          messageText: message,
          type: ChatMessageType.SYSTEM_MESSAGE
        }
      )
      .returning();

    return result;
  }

  async writeRoomMessage(senderUserId: string, chatRoomId: string, message: string) {
    // find the room first
    const room = await this.isUserInRoom(senderUserId, chatRoomId);

    if (!room || room.role === ChatRoomMemberRole.SPECTATOR)
      return null;

    // found room then we can insert new message

    const [result] = await this.db
      .insert(chat_messages)
      .values(
        {
          chatRoomId: chatRoomId,
          userId: senderUserId,
          messageText: message
        }
      )
      .returning();

    return (result);
  }
}
