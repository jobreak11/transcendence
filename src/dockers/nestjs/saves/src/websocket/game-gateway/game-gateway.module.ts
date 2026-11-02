import { Module } from "@nestjs/common";
import { GameGatewayService } from "./game-gameway.service.js";
import { GameGateway } from "./game-gateway.js";
import { GameConnectionGateway } from "./game-connection-gateway/game-connection-gateway.js";
import { GameConnectionGatewayModule } from "./game-connection-gateway/game-connection-gateway.module.js";
import { GameRedisModule } from "../../redis/game-redis/game-redis.module.js";

@Module({
  imports: [GameConnectionGatewayModule, GameRedisModule],
  providers: [GameGatewayService, GameGateway],
  exports: [GameGatewayService]
})
export class GameGatewayModule {

}