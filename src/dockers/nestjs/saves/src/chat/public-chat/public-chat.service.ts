import { Injectable, Logger } from "@nestjs/common";
import { ChatPublicRedisService } from "../../redis/chat-redis/chat-public-redis/chat-public-redis.service.js";

@Injectable()
export class PublicChatService {

  private readonly logger = new Logger(PublicChatService.name)

  constructor(
    private readonly chatPublicRedisService: ChatPublicRedisService,
  ) {

  }

  getPublicChatHistory() {
    return this.chatPublicRedisService.getMessages();
  }

}