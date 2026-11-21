import { Module } from "@nestjs/common";
import { ChatPublicRedisService } from "./chat-public-redis.service.js";

@Module({
  providers: [ChatPublicRedisService],
  exports: [ChatPublicRedisService]
})
export class ChatPublicRedisModule {

}
