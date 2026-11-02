import { Module } from "@nestjs/common";
import { LobbyGatewayService } from "./lobby-gateway.service.js";
import { LobbyGateway } from "./lobby.gateway.js";
import { LobbyRedisService } from "../../../redis/lobby-redis/lobby-redis.service.js";
import { UserRedisModule } from "../../../redis/user-redis/user-redis.module.js";

@Module({
  imports: [UserRedisModule],
  providers: [LobbyGatewayService, LobbyGateway],
  exports: [LobbyGatewayService]
})
export class LobbyGatewayModule {

}
