import { Module } from "@nestjs/common";
import { PublicChatController } from "./public-chat.controller.js";
import { PublicChatService } from "./public-chat.service.js";
import { ChatPublicRedisModule } from "../../redis/chat-redis/chat-public-redis/chat-public-redis.module.js";

@Module({
  imports: [ChatPublicRedisModule],
  providers: [PublicChatService],
  controllers: [PublicChatController]
})
export class PublicChatModule {
  

}