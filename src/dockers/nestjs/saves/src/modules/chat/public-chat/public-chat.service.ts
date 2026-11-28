import { Injectable, Logger } from "@nestjs/common";
import { PublicChatRedisService } from "./redis/public-chat-redis.service.js";

@Injectable()
export class PublicChatService {

  private readonly logger = new Logger(PublicChatService.name)

  constructor(
    private readonly publicChatRedisService: PublicChatRedisService,
  ) {

  }

  getPublicChatHistory() {
    return this.publicChatRedisService.getMessages();
  }

}