import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { REDIS_CLIENT } from "../redis.provider.js";
import type { RedisClient } from "../redis.provider.js";
import { redis_chat_room_all_keys, redis_chat_room_details, redis_chat_room_member_details, redis_chat_room_member_lists, redis_chat_room_messages, redis_chat_room_spectator_lists, redis_chat_user_room_list } from "./namespaces/chat-redis.namespace.js";
import { ChatRoomDto } from "../../drizzle/schema/chat_rooms/chat_room.dto.js";
import { ChatRoomVisibilityType } from "../../drizzle/schema/chat_rooms/chat_rooms.schema.js";
import { ChatRoomMemberRole } from "../../drizzle/schema/chat_room_members/chat_room_members.schema.js";
import { ChatRoomMemberDto } from "../../drizzle/schema/chat_room_members/chat_room_member.dto.js";
import { logError } from "../../utility/logError.js";
import { logErrorRedisError, logErrorRedisPipeLine } from "../utility/redis-logError.js";
import { errorWithCode } from "../../utility/errorWithCode.js";
import { ChatMessageDto } from "../../chat/dtos/chat-message.dto.js";
import { ChatMessageType } from "../../drizzle/schema/chat_messages/chat_messages.schema.js";

@Injectable()
export class ChatRedisService implements OnModuleInit {

  private readonly logger = new Logger(ChatRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient
  ) {

  }

  async onModuleInit() {

    // return 0 success
    // return 1 chat room doesn't exist
    await this.redis.defineCommand('writeChatRoomMessage', {
      numberOfKeys: 2,
      readOnly: false,
      lua: `
        local chatRoomKey = KEYS[1]
        local chatMessageListKey = KEYS[2]

        local newMessage = ARGV[1]
        local limit = tonumber(ARGV[2])

        if redis.call('EXISTS', chatRoomKey) == 0 then
          return 1
        end

        redis.call('LPUSH', chatMessageListKey, newMessage)
        redis.call('LTRIM', chatMessageListKey, 0, limit - 1);

        return 0
      `
    })

  }

  async findAllChatRooms(userId: string)
  : Promise<ChatRoomDto[]> {

    const allRooms = await this.redis.smembers(
      redis_chat_user_room_list(userId)
    )

    const result: ChatRoomDto[] = [];
    const promiseArray = allRooms.map((room) => this.findChatRoom(room))

    const promiseResult = await Promise.allSettled(promiseArray);

    promiseResult.forEach((res) => {
      if (res.status === "fulfilled") {
        if (res.value !== null) {
          result.push(res.value);
        }
      }
    })

    return result;
  }

  async findChatRoom(chatRoomId: string): Promise<ChatRoomDto | null> {

    const resAll = await this.redis.pipeline()
      .exists(redis_chat_room_details(chatRoomId))
      .hgetall(redis_chat_room_details(chatRoomId))
      .exec()

    if (!resAll) {
      throw logErrorRedisPipeLine(this.logger, "findChatRoom");
    }

    const errObj: Error[] = [];

    for (const [err] of resAll) {
      if (err) {
        errObj.push(err);
      }
    }

    if (errObj.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "findChatRoom()",
        errObj
      );
    }

    const [
      [, isExist],
      [, rawRoomDetails]

    ] = resAll as [
      [Error | null, number] ,
      [Error | null, Record<string,string>] ,
    ]

    if (isExist === 0) {
      // the chatroom is not exist
      return null;
    }

    const result = this.recordToChatRoomDetails(rawRoomDetails);

    return result;
  }

  private recordToChatRoomDetails(record: Record<string,string>): ChatRoomDto {

    return {
      id: record.id,
      roomName: record.roomName ?? null,
      visibilityType: record.visibilityType as ChatRoomVisibilityType,
      createdAt: new Date(record.createdAt)
    }
  }

  private chatRoomDetailsToRecord(details: ChatRoomDto): Record<string,string> {

    const raw = Object.fromEntries(
      Object.entries(details)
        .map(([key, value]) => ([key, value instanceof Date ? value.toISOString() : String(value)]))
    );
    
    return raw;
  }

  async createChatRoom(chatRoomDto: ChatRoomDto) {

    const isExist = await this.redis.exists(redis_chat_room_details(chatRoomDto.id));
    
    if (isExist !== 1)  {
      throw logError(
        this.logger,
        "error from creatChatRoom()",
        "chat room id conflict when insert",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const record = this.chatRoomDetailsToRecord(chatRoomDto);

    await this.redis.hset(redis_chat_room_details(chatRoomDto.id), record);

    return chatRoomDto;
  }

  async joinRoom(toJoinUserId: string, chatRoomId: string, role: ChatRoomMemberRole = ChatRoomMemberRole.MEMBER): Promise<ChatRoomMemberDto> {

    // join room requires atomic operation ?
    // no need because no room limit i think

    // but need to perform check manually
    // check first if toJoinUserId and ChatRoomId exists

    const allRes1 = await this.redis.pipeline()
      .exists(redis_chat_room_details(chatRoomId))
      .zscore(redis_chat_room_member_lists(chatRoomId), toJoinUserId)
      .exec();

    if (!allRes1) {
      throw logErrorRedisPipeLine(this.logger, "joinRoom()");
    }

    const errObjs: Error[] = [];
    for (const [err] of allRes1) {
      if (err) {
        errObjs.push(err);
      }
    }

    if (errObjs.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "joinRoom()",
        errObjs
      );
    }


    const [
      [, isExist],
      [, score]
    ] = allRes1 as [
      [Error | null, number],
      [Error | null, string | null],
    ];

    if (!isExist) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "the chat room is not exist"
      )
    }
    if (score) {
      throw errorWithCode(
        HttpStatus.CONFLICT,
        "this user is already in chat room",
      );

    }


    // create object

    const result: ChatRoomMemberDto =  {
      chatRoomId: chatRoomId,
      userId: toJoinUserId,
      role: role,
      joinedAt: new Date()
    }
    const record = this.chatRoomMemberToRecord(result);

    const pipeline2 = this.redis.pipeline();

    if (role === ChatRoomMemberRole.SPECTATOR) {
      pipeline2.zadd(
        redis_chat_room_spectator_lists(chatRoomId),
        Date.now(),
        toJoinUserId
      )
    }
    else {
      pipeline2.zadd(
        redis_chat_room_member_lists(chatRoomId),
        Date.now(),
        toJoinUserId
      )
    }

    pipeline2
      .sadd(redis_chat_user_room_list(toJoinUserId), chatRoomId)
      .hset(redis_chat_room_member_details(chatRoomId, toJoinUserId), record);

    // so now need to join in room member
    const allRes2 = await pipeline2.exec();

    if (!allRes2) {
      throw logErrorRedisPipeLine(this.logger, "joinRoom()");
    }

    const err2: Error[] = [];

    for (const [err] of allRes2) {
      if (err) {
        err2.push(err);
      }
    }

    if (err2.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "joinRoom()",
        err2
      );
    }

    return result
  }

  private chatRoomMemberToRecord(chatRoomMemberDto: ChatRoomMemberDto): Record<string,string> {

    const result = Object.fromEntries(
      Object.entries(chatRoomMemberDto)
        .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : String(value)])
    )

    return result
  }

  private recordToChatRoomMember(record: Record<string,string>): ChatRoomMemberDto {
    return {
      chatRoomId: record.chatRoomId,
      userId: record.userId,
      role: record.role as ChatRoomMemberRole,
      joinedAt: new Date(record.joinedAt)
    }
  }

  async getChatRoomMemberDto(chatRoomId: string, userId: string)
  : Promise<ChatRoomMemberDto> {

    const res = await this.redis.hgetall(
      redis_chat_room_member_details(chatRoomId, userId)
    );

    if (Object.keys(res).length === 0) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "chat room member not found"
      )
    }

    return this.recordToChatRoomMember(res);
  }


  async currentRoomMemberCount(chatRoomId: string)
  : Promise<{memberCount: number, spectatorCount: number}> {


    const resAll = await this.redis.pipeline()
      .exists(redis_chat_room_details(chatRoomId))
      .zcard(redis_chat_room_member_lists(chatRoomId))
      .zcard(redis_chat_room_spectator_lists(chatRoomId))
      .exec();


    if (!resAll) {
      throw logErrorRedisPipeLine(
        this.logger,
        "currentRoomMemberCount()"
      );
    }

    const errObj: Error[] = [];

    for (const [err] of resAll) {
      if (err) {
        errObj.push(err);
      }
    }
    if (errObj.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "currentRoomMemberCount()",
        errObj,
      )
    }
    
    const [
      [, isExist],
      [, memberCount],
      [, spectatorCount]
    ] = resAll as [
      [Error | null, number],
      [Error | null, number],
      [Error | null, number],
    ]

    if (isExist === 0) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "chat room id not found"
      )
    }

    return {
      memberCount: memberCount,
      spectatorCount: spectatorCount,
    };

  }

  async leaveRoom(toLeaveUserId: string, chatRoomId: string)
  : Promise<ChatRoomMemberDto> {

    const allRes1 = await this.redis.pipeline()
      .exists(redis_chat_room_member_details(chatRoomId, toLeaveUserId))
      .hgetall(redis_chat_room_member_details(chatRoomId, toLeaveUserId))
      .exec()


    if (!allRes1) {
      throw logErrorRedisPipeLine(
        this.logger,
        "leaveRoom()"
      );
    }

    {
      const errObj: Error[] = [];
      for (const [err] of allRes1) {
        if (err) {
          errObj.push(err);
        }
      }
    
      if (errObj.length !== 0) {
        throw logErrorRedisError(
          this.logger,
          "leaveRoom()",
          errObj
        );
      }
    }
    // check role also

    const [
      [, isExist],
      [, recordMember]
    ] = allRes1 as [
      [Error | null, number] ,
      [Error | null, Record<string,string>] ,
    ]

    if (isExist === 0) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "target user or chatroom to leave not found"
      )
    }

    const memberDetails = this.recordToChatRoomMember(recordMember);

    const pipeline2 = this.redis.pipeline();

    pipeline2.unlink(
      redis_chat_room_member_details(chatRoomId, toLeaveUserId),
    )
    pipeline2.srem(
      redis_chat_user_room_list(toLeaveUserId)
    )

    if (memberDetails.role === ChatRoomMemberRole.SPECTATOR) {
      pipeline2.zrem(redis_chat_room_spectator_lists(chatRoomId), toLeaveUserId);
    }
    else {
      pipeline2.zrem(redis_chat_room_member_lists(chatRoomId), toLeaveUserId);
    }

    const allRes2 = await pipeline2.exec();

    if (!allRes2) {
      throw logErrorRedisPipeLine(
        this.logger,
        "leaveRoom()"
      )
    }

    {
      const errs: Error[] = [];
      for (const [err] of allRes2) {
        if (err) {
          errs.push(err);
        }
      }
      if (errs.length !== 0) {
        throw logErrorRedisError(
          this.logger,
          "leaveRoom()",
          errs
        )
      }
    }

    {
      const currentRoomCount = await this.currentRoomMemberCount(chatRoomId);

      if (currentRoomCount.memberCount <= 0 && currentRoomCount.spectatorCount <= 0) {
        await this.removeRoom(chatRoomId);
        return memberDetails;
      }
    }

    if (memberDetails.role !== ChatRoomMemberRole.OWNER) {
      return memberDetails;
    }

    const allRes3 = await this.redis.pipeline()
      .zrange(redis_chat_room_member_lists(chatRoomId), 0, "0")
      .zrange(redis_chat_room_spectator_lists(chatRoomId), 0, "0")
      .exec();

    if (!allRes3) {
      throw logErrorRedisPipeLine(
        this.logger,
        "leaveRoom()"
      )
    }

    const err3: Error[] = [];
    for (const [err] of allRes3) {
      if (err) {
        err3.push(err);
      }
    }
    if (err3.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "leaveRoom",
        err3
      );
    }

    const [
      [, oldestMemberIds],
      [, oldestSpectatorIds],
    ] = allRes3 as [
      [Error | null, string[]],
      [Error | null, string[]],
    ]

    const oldestMemberId = oldestMemberIds[0];
    const oldestSpectatorId = oldestSpectatorIds[0];

    if (oldestMemberId) {
      await this.setRole(chatRoomId, oldestMemberId, ChatRoomMemberRole.OWNER);
    }
    else if (oldestSpectatorId) {
      await this.setRole(chatRoomId, oldestSpectatorId, ChatRoomMemberRole.OWNER);
    }

    return memberDetails;
  }

  async setRole(chatRoomId: string, userId: string, role: ChatRoomMemberRole)
  : Promise<ChatRoomMemberDto> {

    const res = await this.redis.hsetOneIfKeyAndFieldExist(
      redis_chat_room_member_details(chatRoomId, userId),
      "role",
      role.toString(),
    )

    if (res === 0) {
      // zero means the field is not found, meaning that 
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "room member not found",
      );
    }

    const data = await this.getChatRoomMemberDto(chatRoomId, userId);

    return data;
  }


  async removeRoom(chatRoomId: string): Promise<ChatRoomDto> {

    // get the member list of that room first

    const allRes = await this.redis.pipeline()
      .exists(redis_chat_room_details(chatRoomId))
      .hgetall(redis_chat_room_details(chatRoomId))
      .zrange(redis_chat_room_member_lists(chatRoomId), 0, "-1")
      .zrange(redis_chat_room_spectator_lists(chatRoomId), 0, "-1")
      .exec();

    if (!allRes) {
      throw logErrorRedisPipeLine(this.logger, "removeRoom()");
    }

    const errObj: Error[] = [];

    for (const [err] of allRes) {
      if (err) {
        errObj.push(err);
      }
    }

    if (errObj.length !== 0) {
      throw logErrorRedisError(
        this.logger,
        "removeRoom()",
        errObj
      )
    }

    const [
      [, isExist],
      [, roomDetails],
      [, roomMembers],
      [, roomSpectators]
    ] = allRes as [
      [Error | null, number] ,
      [Error | null, Record<string,string>] ,
      [Error | null, string[]] ,
      [Error | null, string[]] ,
    ]

    if (isExist === 0) {
      throw errorWithCode(HttpStatus.NOT_FOUND, "room to remove is not exist");
    }

    const pipeline2 = this.redis.pipeline();
    for (const memberId of roomMembers) {
      pipeline2.srem(redis_chat_user_room_list(memberId), chatRoomId);
      pipeline2.unlink(redis_chat_room_member_details(chatRoomId, memberId));
    }
    for (const memberId of roomSpectators) {
      pipeline2.srem(redis_chat_user_room_list(memberId), chatRoomId);
      pipeline2.unlink(redis_chat_room_member_details(chatRoomId, memberId));
    }


    pipeline2.unlink(
      ...redis_chat_room_all_keys(chatRoomId)
    )

    const allResult = await pipeline2.exec();

    if (!allResult) {
      throw logErrorRedisPipeLine(
        this.logger,
        "removeRoom()"
      );
    }

    return this.recordToChatRoomDetails(roomDetails);
  }


  private chatMessageDtoToRecord(chatMessage: ChatMessageDto)
  : Record<string,string> {

    const res = Object.fromEntries(
      Object.entries(chatMessage)
        .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : String(value)])
    )

    return res;
  }

  private recordToChatMessageDto (record: Record<string,string>)
  : ChatMessageDto {

    return {
      userId: record.userId ?? null,
      type: record.type as ChatMessageType,
      createdAt: new Date(record.createdAt),
      messageText: record.messageText
    }

  }

  async getMessages(chatRoomId: string, limit: number = 200) {
    if (limit <= 0) {
      throw logError(
        this.logger,
        "error from getMessages()",
        "limit invalid",
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    const messages = await this.redis.lrange(
      redis_chat_room_messages(chatRoomId),
      0,
      limit - 1
    )

    const formatedMessages: ChatMessageDto[] = [];
    for (const message of messages) {
      formatedMessages.push(JSON.parse(message) as ChatMessageDto);
    }

    return formatedMessages
  }

  async writeMessage(chatRoomId: string, payload: ChatMessageDto) {

    const res = await this.redis.writeChatRoomMessage(
      redis_chat_room_details(chatRoomId),
      redis_chat_room_messages(chatRoomId),
      JSON.stringify(payload)
    );

    if (res === 1) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "chat room not found"
      );
    }

    return payload;
  }
}

