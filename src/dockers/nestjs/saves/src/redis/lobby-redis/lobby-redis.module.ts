import { Module } from "@nestjs/common";
import { LobbyRedisService } from "./lobby-redis.service.js";
import { UserRedisModule } from "../user-redis/user-redis.module.js";
import { ChatModule } from "../../chat/chat.module.js";
import { GameRedisModule } from "../game-redis/game-redis.module.js";
import { LobbyGatewayModule } from "../../websocket/main-gateway/lobby-gateway/lobby-gateway.module.js";
import { GameGatewayModule } from "../../websocket/game-gateway/game-gateway.module.js";

@Module({
  imports: [UserRedisModule, ChatModule, GameRedisModule, LobbyGatewayModule, GameGatewayModule],
  providers: [LobbyRedisService],
  exports: [LobbyRedisService]
})
export class LobbyRedisModule {

}