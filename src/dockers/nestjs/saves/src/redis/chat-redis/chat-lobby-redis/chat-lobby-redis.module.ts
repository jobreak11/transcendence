import { Module } from "@nestjs/common";
import { ChatLobbyRedisService } from "./chat-lobby-redis.service.js";
import { ChatRedisModule } from "../chat-redis.module.js";


@Module({
  imports: [ChatRedisModule],
  providers: [ChatLobbyRedisService],
  exports: [ChatLobbyRedisService]
})
export class ChatLobbyRedisModule {

}