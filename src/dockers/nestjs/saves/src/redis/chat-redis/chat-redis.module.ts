import { Module } from "@nestjs/common";
import { ChatRedisService } from "./chat-redis.service.js";

@Module({
  providers: [ChatRedisService],
  exports: [ChatRedisService],
})
// temporary chat message storage in redis
export class ChatRedisModule {

}