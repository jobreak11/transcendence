import { Module } from "@nestjs/common";
import { PublicChatService } from "./public-chat.service.js";
import { PublicChatRedisService } from "./redis/public-chat-redis.service.js";
import { PublicChatCachingService } from "./caching/public-chat-caching.service.js";

@Module({
  providers: [PublicChatService, PublicChatRedisService, PublicChatCachingService],
  exports: [PublicChatService, PublicChatRedisService]
})
export class PublicChatModule {
  

}