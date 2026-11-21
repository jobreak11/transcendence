import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT } from "../../redis.provider.js";
import type { RedisClient } from "../../redis.provider.js";
import { string } from "zod";
import { ChatMessageDto } from "../../../chat/dtos/chat-message.dto.js";
import { redis_chat_public_messages } from "./namespaces/chat-public-redis.namespaces.js";
import { REDIS_CHAT_PUBLIC_MESSAGE_LIMIT } from "./chat-public-redis.constants.js";
import { logErrorRedisError, logErrorRedisPipeLine } from "../../utility/redis-logError.js";
import { logError } from "../../../utility/logError.js";

@Injectable()
export class ChatPublicRedisService {

  private readonly logger = new Logger(ChatPublicRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,

  ) {
  }

  async writeMessage(
    payload: ChatMessageDto
  ) {

    const allRes = await this.redis.pipeline()
      .lpush(redis_chat_public_messages(), JSON.stringify(payload))
      .ltrim(redis_chat_public_messages(), 0, REDIS_CHAT_PUBLIC_MESSAGE_LIMIT - 1)
      .exec()

    if (!allRes) {
      throw logErrorRedisPipeLine(
        this.logger,
        "writeMessage()"
      );
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
        "writeMessage()",
        errObj,
      )
    }

    return payload
  }

  async getMessages(limit: number = 200) {
    
    if (limit <= 0) {
      throw logError(
        this.logger,
        "error from getMessages()",
        "limit invalid",
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    const messages = await this.redis.lrange(
      redis_chat_public_messages(),
      0,
      limit - 1
    );

    const formatedMessages: ChatMessageDto[] = [];
    for (const message of messages) {
      formatedMessages.push(JSON.parse(message) as ChatMessageDto);
    }

    return formatedMessages;
  }

}