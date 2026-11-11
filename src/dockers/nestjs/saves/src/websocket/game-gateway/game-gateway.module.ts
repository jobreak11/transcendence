import { Module } from "@nestjs/common";
import { GameGatewayService } from "./game-gameway.service.js";
import { GameGateway } from "./game-gateway.js";
import { GameConnectionGateway } from "./game-connection-gateway/game-connection-gateway.js";
import { GameConnectionGatewayModule } from "./game-connection-gateway/game-connection-gateway.module.js";
import { GameRedisModule } from "../../redis/game-redis/game-redis.module.js";
import { UserRedisModule } from "../../redis/user-redis/user-redis.module.js";
import { LobbyRedisModule } from "../../redis/lobby-redis/lobby-redis.module.js";
import { UserModule } from "../../user/user.module.js";

@Module({
  imports: [GameConnectionGatewayModule, GameRedisModule, UserRedisModule, UserModule],
  providers: [GameGatewayService, GameGateway],
  exports: [GameGatewayService]
})
export class GameGatewayModule {

}