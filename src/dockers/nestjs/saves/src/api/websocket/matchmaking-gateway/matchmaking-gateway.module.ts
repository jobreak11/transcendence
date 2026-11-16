import { Module } from "@nestjs/common";
import { MatchmakingGateway } from "./matchmaking.gateway.js";

@Module({
  providers: [MatchmakingGateway],
})
export class MatchmakingGatewayModule {}
