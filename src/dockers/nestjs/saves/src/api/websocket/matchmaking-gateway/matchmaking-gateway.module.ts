import { Module } from "@nestjs/common";
import { MatchmakingGateway } from "./matchmaking.gateway.js";
import { LobbyModule } from "../../../modules/lobby/lobby.module.js";

@Module({
  imports: [LobbyModule],
  providers: [MatchmakingGateway],
})
export class MatchmakingGatewayModule {}
