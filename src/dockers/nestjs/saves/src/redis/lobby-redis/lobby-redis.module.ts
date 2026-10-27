import { Module } from "@nestjs/common";
import { LobbyRedisService } from "./lobby-redis.service.js";
import { UserRedisModule } from "../user-redis/user-redis.module.js";
import { ChatModule } from "../../chat/chat.module.js";

@Module({
  imports: [UserRedisModule, ChatModule],
  providers: [LobbyRedisService],
  exports: [LobbyRedisService]
})
export class LobbyRedisModule {

}