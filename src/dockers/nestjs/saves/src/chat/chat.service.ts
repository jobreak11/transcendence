import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import z from "zod";
import { chatRoomCreateSchema } from "./schemas/chat-room-create.schema.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../drizzle/drizzle.module.js";
import { dbRelations } from "../drizzle/schema/schema.js";
import { UserService } from "../user/user.service.js";
import { ChatRedisService } from "../redis/chat-redis/chat-redis.service.js";
import { chat_rooms, ChatRoomVisibilityType } from "../drizzle/schema/chat_rooms/chat_rooms.schema.js";
import { chat_room_members, ChatRoomMemberRole } from "../drizzle/schema/chat_room_members/chat_room_members.schema.js";
import { GetChatRoomDto } from "./dtos/get-chat-room.dto.js";
import { ChatRoomCreateInputDto } from "./dtos/chat-room-create.dto.js";
import { ChatRoomDto } from "../drizzle/schema/chat_rooms/chat_room.dto.js";
import { v7 as uuidv7 } from "uuid";
import { NotFoundError } from "rxjs";
import { ChatRoomMemberDto } from "../drizzle/schema/chat_room_members/chat_room_member.dto.js";
import { and, count, eq, inArray, or } from "drizzle-orm";
import { logError } from "../utility/logError.js";
import { error, log } from "console";
import { errorWithCode } from "../utility/errorWithCode.js";
import { ChatMessageDto } from "./dtos/chat-message.dto.js";
import { chat_messages, ChatMessageType } from "../drizzle/schema/chat_messages/chat_messages.schema.js";
import { alias } from "drizzle-orm/pg-core";

@Injectable()
export class ChatService {

  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbRelations>,
    private readonly userService: UserService,
    private readonly chatRedisService: ChatRedisService
  ) {

  }

  isChatRoomExist() {

  }

  async findAllChatRooms(userId: string):
  Promise<ChatRoomDto[]> {

    const dbRoomMember = await this.db.query.chat_room_members.findMany({
      where: {
        userId: userId
      },
    });

    const chatRoomIdArray = dbRoomMember.map((res) => {
      return res.chatRoomId
    })

    const dbResult = await this.db
      .select()
      .from(chat_rooms)
      .where(
        inArray(chat_rooms.id, chatRoomIdArray)
      );

    

    const redisResult = await this.chatRedisService.findAllChatRooms(userId);

    return [...dbResult, ...redisResult];
  }

  async createNewChatRoom(createNewChatRoomDto: ChatRoomCreateInputDto)
  : Promise<ChatRoomDto> {

    const result = chatRoomCreateSchema.insert.safeParse(createNewChatRoomDto);

    if (!result.success) {
      const treeErrors = z.treeifyError(result.error);

      throw logError(
        this.logger,
        "error from createNewChatRoom()",
        "invalid payload for this function",
        HttpStatus.BAD_REQUEST,
        treeErrors
      )

    }

    const inputPayload = result.data;

    const genId = uuidv7();

    if (inputPayload.isTemporary) {

      const res = await this.chatRedisService.createChatRoom({
        id: genId,
        roomName: inputPayload.roomName,
        visibilityType: inputPayload.visibilityType,
        createdAt: new Date()
      });

      if (inputPayload.createdByUserId) {
        const redisJoined = await this.chatRedisService.joinRoom(
          inputPayload.createdByUserId,
          genId,
          ChatRoomMemberRole.OWNER
        )
      }

      return res;
    }
    else {
      try {

        const [createdRoom] = await this.db
          .insert(chat_rooms)
          .values({
            id: genId,
            roomName: inputPayload.roomName,
            visibilityType: inputPayload.visibilityType,
          })
          .returning()

          if (inputPayload.createdByUserId) {
            const joined = await this.joinRoom(
              inputPayload.createdByUserId,
              genId,
              ChatRoomMemberRole.OWNER
            );

          }

          return createdRoom;
        
      } catch (error: any) {

        throw logError(
          this.logger,
          "error from createNewChatRoom()",
          "unknown error",
          HttpStatus.INTERNAL_SERVER_ERROR,
          error
        );

      }
    }
  }

  // true false if temporary, not exist return null
  async isChatRoomTemporary(chatRoomId: string): Promise<boolean> {

    const res1 = await this.db.query.chat_rooms.findFirst({
      where:{
        id: chatRoomId
      }
    });

    if (res1 === undefined) {
      const res2 = await this.chatRedisService.findChatRoom(chatRoomId);

      if (res2 === null) {
        throw errorWithCode(
          HttpStatus.NOT_FOUND,
          "chat room not found"
        );
      }

      return true;
    }

    return false;
  }

  async joinRoom(toJoinUserId: string, chatRoomId: string, role: ChatRoomMemberRole = ChatRoomMemberRole.MEMBER): Promise<ChatRoomMemberDto> {

    const isTemp = await this.isChatRoomTemporary(chatRoomId);
    if (isTemp === true) {
      return this.chatRedisService.joinRoom(
        toJoinUserId,
        chatRoomId,
        role
      )
    }

    try {
      const [result] = await this.db
        .insert(chat_room_members)
        .values({
          chatRoomId: chatRoomId,
          userId: toJoinUserId,
          role: role
        })
        .returning();

      return result;
    }
    catch (error: any) {
      if (error?.cause?.code) {
        if (error?.cause?.code === '23505') {
          // not unique, meaing that user is already in chat room

          throw errorWithCode(
            HttpStatus.CONFLICT,
            "user is already in this room",
          );
        }
        if (error?.cause?.code === '23503') {
          // foreign key error, could be userId or chat room id
          throw errorWithCode(
            HttpStatus.NOT_FOUND,
            "user or chat room is not found",
          )
        }
      }

      throw logError(
        this.logger,
        "error from joinRoom()",
        "unknown error",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error
      )

    }
    
  }

  // find chat room from both redis and database
  // must find one
  async findOne(chatRoomId: string): Promise<GetChatRoomDto | null> {

    const [dbResult, redisResult] = await Promise.allSettled([
      this.db.query.chat_rooms.findFirst({
        where: {
          id: chatRoomId
        }
      }),
      this.chatRedisService.findChatRoom(chatRoomId)
    ])

    let dbChatRoom: ChatRoomDto | null = null;
    if (dbResult.status === 'fulfilled') {
      dbChatRoom = dbResult.value ?? null;
    }
    let redisChatRoom: ChatRoomDto | null = null;
    if (redisResult.status === 'fulfilled') {
      redisChatRoom = redisResult.value;
    }

    if (dbChatRoom && redisChatRoom) {
      throw logError(
        this.logger,
        "error from findOne()",
        "unknown",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "found multiple chat room but suppose to found only one"
      )

    }
    else if (dbChatRoom) {
      return {
        roomName: dbChatRoom.roomName,
        createdAt: dbChatRoom.createdAt,
        visibilityType: dbChatRoom.visibilityType,
        isTemporary: false,
      }
    }
    else if (redisChatRoom) {
      return {
        roomName: redisChatRoom.roomName,
        createdAt: redisChatRoom.createdAt,
        visibilityType: redisChatRoom.visibilityType,
        isTemporary: true,
      }
    }
    else {
      return null;
    }
  }

  async currentRoomMemberCount(chatRoomId: string) 
  : Promise<{memberCount: number, spectatorCount: number}> {

    const isTemp = await this.isChatRoomTemporary(chatRoomId);

    if (isTemp === true) {
      return this.chatRedisService.currentRoomMemberCount(chatRoomId);
    }

    const [memberCount] = await this.db
      .select({
        count: count()
      })
      .from(chat_room_members)
      .where(
        and(
          eq(chat_room_members.chatRoomId, chatRoomId),
          or(
            eq(chat_room_members.role, ChatRoomMemberRole.OWNER),
            eq(chat_room_members.role, ChatRoomMemberRole.MEMBER),
          )
        )
      );

    const [spectatorCount] = await this.db
      .select({
        count: count()
      })
      .from(chat_room_members)
      .where(
        and(
          eq(chat_room_members.chatRoomId, chatRoomId),
          eq(chat_room_members.role, ChatRoomMemberRole.SPECTATOR)
        )
      )

    return {
      memberCount: memberCount?.count ?? 0,
      spectatorCount: spectatorCount?.count ?? 0
    }
  }
  

  async leaveRoom(toLeaveUserId: string, chatRoomId: string)
  : Promise<ChatRoomMemberDto> {

    const isTemporary = await this.isChatRoomTemporary(chatRoomId);

    if (isTemporary === true) {

      const data = await this.chatRedisService.leaveRoom(
        toLeaveUserId, chatRoomId
      )

      return data;

    } else {

      const [res] = await this.db
        .delete(chat_room_members)
        .where(
          and(
            eq(chat_room_members.userId, toLeaveUserId),
            eq(chat_room_members.userId, chatRoomId)
          )
        )
        .returning();

      if (!res) {
        throw errorWithCode(HttpStatus.NOT_FOUND, "target room member to remove not found");
      }

      // findone of oldest member

      const currentRoomCount = await this.currentRoomMemberCount(chatRoomId);

      if (currentRoomCount.memberCount <= 0 && currentRoomCount.spectatorCount <= 0) {
        await this.removeRoom(chatRoomId);
        return res;
      }

      if (res.role !== ChatRoomMemberRole.OWNER) {
        return res;
      }

      const oldestRoomMember = await this.db.query.chat_room_members.findFirst({
        where: {
          chatRoomId: chatRoomId,
          role: ChatRoomMemberRole.MEMBER
        },
        orderBy: {
          joinedAt: "asc"
        }
      });

      const oldestRoomSpectator = await this.db.query.chat_room_members.findFirst({
        where: {
          chatRoomId: chatRoomId,
          role: ChatRoomMemberRole.SPECTATOR
        },
        orderBy: {
          joinedAt: "asc"
        }
      })

      if (oldestRoomMember) {
        await this.setRole(chatRoomId, oldestRoomMember.userId, ChatRoomMemberRole.OWNER);
      }
      else if (oldestRoomSpectator) {

        await this.setRole(chatRoomId, oldestRoomSpectator.userId, ChatRoomMemberRole.OWNER);
      }

      return res;
    }
  }

  async setRole(chatRoomId: string, userId: string, role: ChatRoomMemberRole)
  : Promise<ChatRoomMemberDto> {

    const isTemp = await this.isChatRoomTemporary(chatRoomId);

    if (isTemp === true) {
      return this.chatRedisService.setRole(chatRoomId, userId, role);
    }

    const [updated] = await this.db
      .update(chat_room_members)
      .set({
        role: role
      })
      .where(
        and(
          eq(chat_room_members.chatRoomId, chatRoomId),
          eq(chat_room_members.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "room member not found"
      );
    }

    return updated;
  }

  async removeRoom(chatRoomId: string): Promise<ChatRoomDto> {

    const isTemp = await this.isChatRoomTemporary(chatRoomId);
    
    if (isTemp === true) {
      return this.chatRedisService.removeRoom(chatRoomId);
    }

    const [result] = await this.db
      .delete(chat_rooms)
      .where(
        eq(chat_rooms.id, chatRoomId)
      )
      .returning();

    if (!result) {
      throw errorWithCode(HttpStatus.NOT_FOUND, "room to remove is not found");
    }
    return result;
  }

  async getMessages(chatRoomId:string, limit :number = 50)
  : Promise<ChatMessageDto[]>
   {
    if (limit <= 0) {
      throw logError(
        this.logger,
        "error from getMessages()",
        "limit must not less than 1",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }


    const isTemporary = await this.isChatRoomTemporary(chatRoomId);

    if (isTemporary === true) {
      const result = await this.chatRedisService.getMessages(
        chatRoomId,
        limit
      );

      return result;
    }
    else {

      const result = await this.db.query.chat_messages.findMany({
        where: {
          chatRoomId: chatRoomId
        },
        orderBy: {
          createdAt: "desc"
        },
        limit: limit
      });

      const formattedResult: ChatMessageDto[] = [];

      for (const message of result) {
        formattedResult.push({
          createdAt: message.createdAt,
          userId: message.userId,
          type: message.type,
          messageText: message.messageText
        });
      }

      return formattedResult;
    }
  }

  async writeMessage(
    chatRoomId: string,
    message: string,
    senderUserId?: string
  ) {
    const isTemporary = await this.isChatRoomTemporary(chatRoomId);

    const payload: ChatMessageDto = {
      userId: senderUserId ?? null,
      type: senderUserId ? ChatMessageType.USER_MESSAGE : ChatMessageType.SYSTEM_MESSAGE,
      messageText: message,
      createdAt: new Date()
    };

    if (isTemporary) {

      await this.chatRedisService.writeMessage(
        chatRoomId,
        payload
      );
    }
    else {

      const [result] = await this.db
        .insert(chat_messages)
        .values({
          userId: payload.userId,
          chatRoomId: chatRoomId,
          messageText: payload.messageText,
          type: payload.type,
          createdAt: payload.createdAt
        })
        .returning();

    }
    return payload;
  }

  async directMessageRoom(user1: string, user2: string) 
  : Promise<ChatRoomDto> {

    const m1 = alias(chat_room_members, "m1");
    const m2 = alias(chat_room_members, "m2");

    const [existingRoom] = await this.db
      .select()
      .from(chat_rooms)
      .innerJoin(m1, eq(chat_rooms.id, m1.chatRoomId))
      .innerJoin(m2, eq(chat_rooms.id, m2.chatRoomId))
      .where(
        and(
          eq(m1.userId, user1),
          eq(m2.userId, user2),
          eq(chat_rooms.visibilityType, ChatRoomVisibilityType.DIRECT_MESSAGE)
        )
      )
      .limit(1);

    if (existingRoom) {
      return existingRoom.chat_rooms
    }

    const [newRoom] = await this.db
      .insert(chat_rooms)
      .values({
        visibilityType: ChatRoomVisibilityType.DIRECT_MESSAGE
      })
      .returning();

    const [insert1] = await this.db
      .insert(chat_room_members)
      .values({
        chatRoomId: newRoom.id,
        userId: user1,
        role: ChatRoomMemberRole.MEMBER,
      })
      .returning();

    const [insert2] = await this.db
      .insert(chat_room_members)
      .values({
        chatRoomId: newRoom.id,
        userId: user2,
        role: ChatRoomMemberRole.MEMBER,
      })
      .returning();
  
    return (newRoom);
  }
}