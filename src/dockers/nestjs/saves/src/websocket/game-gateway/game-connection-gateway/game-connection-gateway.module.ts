import { Module } from "@nestjs/common";
import { GameConnectionGateway } from "./game-connection-gateway.js";
import { GameConnectionGatewayService } from "./game-connection-gateway.service.js";
import { AuthModule } from "../../../auth/auth.module.js";
import { UserRedisModule } from "../../../redis/user-redis/user-redis.module.js";

@Module({
  imports: [AuthModule, UserRedisModule],
  providers: [GameConnectionGateway, GameConnectionGatewayService],
  exports: [GameConnectionGatewayService]
})
export class GameConnectionGatewayModule {

}