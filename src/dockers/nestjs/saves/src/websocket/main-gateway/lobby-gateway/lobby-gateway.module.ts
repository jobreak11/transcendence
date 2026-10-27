import { Module } from "@nestjs/common";
import { LobbyGatewayService } from "./lobby-gateway.service.js";
import { LobbyGateway } from "./lobby.gateway.js";
import { LobbyRedisService } from "../../../redis/lobby-redis/lobby-redis.service.js";

@Module({
  imports: [LobbyRedisService],
  providers: [LobbyGatewayService, LobbyGateway],
  exports: [LobbyGatewayService]
})
export class LobbyGatewayModule {

}
