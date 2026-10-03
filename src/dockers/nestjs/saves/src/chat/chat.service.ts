import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
import { UserService } from '../user/user.service.js';
import { REDIS_CLIENT } from '../redis/redis.provider.js';
import type { RedisClient } from '../redis/redis.provider.js';

@Injectable()
export class ChatService {

  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private userService: UserService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient
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

  async createRoom(creatorUserId: string, type?: ChatRoomType, roomName?: string) {

    try {
      const [createdRoom] = await this.db
        .insert(chat_rooms)
        .values({
         type: type ?? ChatRoomType.PRIVATE,
         roomName: roomName
        })
        .returning()

      if (createdRoom) {
        await this.joinRoom(creatorUserId, createdRoom.id, ChatRoomMemberRole.OWNER);
      }

      return createdRoom;
    } catch (error) {
      throw new InternalServerErrorException("unknown error");
    }
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
      throw new InternalServerErrorException("unknown error");
    }
  }


  // Invite the target user into the room, but the host user need to be in the room first before
  async inviteToRoom(hostUserId: string, toJoinUserId: string, chatRoomId:string, role?: ChatRoomMemberRole ) {

    if (hostUserId === toJoinUserId)
      throw new ForbiddenException("Cannot invite yourself into a room");

    // need to check first if this user id is valid 

    const foundRoom = await this.findChatRoom(chatRoomId);

    if (!foundRoom) {
      throw new ForbiddenException("Cannot invite user to the unknown room");
    }

    if (foundRoom.type === ChatRoomType.DIRECT_MESSAGE)
      throw new ForbiddenException("Cannot invite any user into direct message room");

    const hostUserInRoom = await this.isUserInRoom(hostUserId, chatRoomId);

    if (!hostUserInRoom)
      throw new ForbiddenException("you cannot invite some to a room if you are not in the room");


    if (hostUserInRoom.role === ChatRoomMemberRole.SPECTATOR)
      throw new ForbiddenException("SPECTATOR ROLE cannot invite other user in the room");

    if (hostUserInRoom.role === ChatRoomMemberRole.OWNER) {

      await this.writeRoomSystemMessage(chatRoomId, `user ${hostUserId} invited user ${toJoinUserId} into the room.`);
      return await this.joinRoom(toJoinUserId, chatRoomId, role);
    } else {
      if (foundRoom.type === ChatRoomType.PRIVATE) {
        throw new ForbiddenException("Private room can only be invited by OWNER");
      } 
      if (role) {
        if (role === ChatRoomMemberRole.OWNER)
          throw new ForbiddenException("only OWNER can invite new user as OWNER role");

        await this.writeRoomSystemMessage(chatRoomId, `user ${hostUserId} invited user ${toJoinUserId} into the room.`);
        return await this.joinRoom(toJoinUserId, chatRoomId, role);
      }
      else {
        await this.writeRoomSystemMessage(chatRoomId, `user ${hostUserId} invited user ${toJoinUserId} into the room.`);
        return await this.joinRoom(toJoinUserId, chatRoomId, ChatRoomMemberRole.MEMBER);
      }
    }
  }

  // this userId want to leave the chat room
  async leaveChatRoom(userId: string, chatRoomId: string) {

    // need to make sure that that the target user is really in the room first
    const foundUserRoom = this.isUserInRoom(userId, chatRoomId);

    let res;
    try {
      res = await this.db
        .delete(chat_room_members)
        .where(
          and(
            eq(chat_room_members.userId, userId),
            eq(chat_room_members.chatRoomId, chatRoomId)
          )
        )
        .returning();

    } catch(err) {
      throw new InternalServerErrorException("unknown error");
    }

    if (!res || res.length !== 1)
      throw new BadRequestException("Cannot leave the room");


    this.writeRoomSystemMessage(chatRoomId, `User ${userId} just left the chat room`);
    return (res);
  }

  // kick user from a chat room 
  async kickUserChatRoom(hostUserId: string, toKickUserId: string, chatRoomId: string) {

    if (hostUserId === toKickUserId)
      throw new ForbiddenException("Cannot kick yourself out of a room");
    // get the role of the host user first;
    const hostFoundUserRoom = await this.isUserInRoom(hostUserId, chatRoomId);

    if (hostFoundUserRoom.role !== ChatRoomMemberRole.OWNER) {
      throw new ForbiddenException("only OWNER can kick user out of the chat room");
    }

    const toKickUserFoundRoom = await this.isUserInRoom(toKickUserId, chatRoomId);

    let res;

    try {
      res = await this.db
        .delete(chat_room_members)
        .where(
          and(
            eq(chat_room_members.chatRoomId, chatRoomId),
            eq(chat_room_members.userId, toKickUserId),
          )
        )
        .returning();

    } catch (err) {
      throw new InternalServerErrorException("unknown error");
    }

    if (!res || res.length !== 1)
      throw new BadRequestException("Cannot kick the target user in the room");

    await this.writeRoomSystemMessage(chatRoomId, `user ${toKickUserId} got kicked out by user ${hostUserId}`);
    return (res);
  }

  async joinRoom(toJoinUserId: string, chatRoomId: string, role?: ChatRoomMemberRole) {

    // check if the user exist
    // this function will automatically throw exceptions if user is not found
    const foundUser = this.userService.findOne(toJoinUserId);


    // check first if user already exist in the room
    const chatRoomFound = await this.findChatRoom(chatRoomId);
    //if (!chatRoomFound)
    //  throw new NotFoundException("Target Room is Not Found");

    //const room = await this.isUserInRoom(toJoinUserId, chatRoomId);

    //if (room) {
    //  // user found
    //  throw new ForbiddenException("The user is already in the room")
    //}

    try {
      const [ result ] = await this.db
        .insert(chat_room_members)
        .values({
          chatRoomId: chatRoomId,
          userId: toJoinUserId,
          role: role ?? ChatRoomMemberRole.MEMBER
        }
        )
        .returning();

      this.logger.debug("insert chat room member success");
      await this.writeRoomSystemMessage(chatRoomId, `user ${toJoinUserId} just joined.`);
      return (result);
    }
    catch (err) {
      this.logger.debug("insert chat room member not found");
      throw new InternalServerErrorException("user to join room failed");
    }
  }

  async findChatRoom(chatRoomId: string) {

    let room
    try {
      room = await this.db
        .select(
        )
        .from(chat_rooms)
        .where(
          eq(chat_rooms.id, chatRoomId)
        )
        .limit(1);

    } catch (err) {
      throw new InternalServerErrorException("unknown error");
    }

    if (!room || room.length !== 1)
      throw new NotFoundException("Chat Room Not Found");

    return (room[0]);
  }

  async isUserInRoom(userId: string, chatRoomId: string) {

    let room;
    try {
      room = await this.db
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

    } catch (err) {
      throw new InternalServerErrorException("unknown error");
    }

    if (!room || room.length !== 1)
      throw new NotFoundException("The user is not in the room");

    return room[0];
  }

  async writeRoomSystemMessage(chatRoomId: string, message: string) {

    try {
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
    } catch (err) {
      throw new InternalServerErrorException("unknown error");
    }
  }

  async writeRoomMessage(senderUserId: string, chatRoomId: string, message: string) {
    // find the room first
    const room = await this.isUserInRoom(senderUserId, chatRoomId);

    if (!room) {
      throw new ForbiddenException("Cannot write message to the room that doesn't belong to the user");
    }
    
    if ( room.role === ChatRoomMemberRole.SPECTATOR)
      throw new ForbiddenException("SPEACTATOR cannot write message to the chat room");

    // found room then we can insert new message

    try {
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
    } catch (err) {
      throw new InternalServerErrorException("unknown error");
    }
  }
}
