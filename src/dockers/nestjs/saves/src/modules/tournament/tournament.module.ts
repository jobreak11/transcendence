import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/drizzle/drizzle.module.js";
import { GameGatewayModule } from "../../api/websocket/game-gateway/game-gateway.module.js";
import { LobbyModule } from "../lobby/lobby.module.js";
import { TournamentDatabaseService } from "./database/tournament-database.service.js";
import { TournamentService } from "./tournament.service.js";
import { TOURNAMENT_RESULT_RECORDER } from "./tournament-result-recorder.js";

@Module({
  imports: [DrizzleModule, LobbyModule, GameGatewayModule],
  providers: [
    TournamentDatabaseService,
    TournamentService,
    { provide: TOURNAMENT_RESULT_RECORDER, useExisting: TournamentService },
  ],
  exports: [TournamentService, TOURNAMENT_RESULT_RECORDER],
})
export class TournamentModule {}
