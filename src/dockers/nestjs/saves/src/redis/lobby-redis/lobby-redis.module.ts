import { Module } from "@nestjs/common";
import { LobbyRedisService } from "./lobby-redis.service.js";
import { UserRedisModule } from "../user-redis/user-redis.module.js";
import { ChatModule } from "../../chat/chat.module.js";
import { GameRedisModule } from "../game-redis/game-redis.module.js";

@Module({
  imports: [UserRedisModule, ChatModule, GameRedisModule],
  providers: [LobbyRedisService],
  exports: [LobbyRedisService]
})
export class LobbyRedisModule {

}