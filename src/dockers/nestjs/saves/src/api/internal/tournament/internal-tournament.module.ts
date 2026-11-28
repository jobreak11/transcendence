import { Module } from "@nestjs/common";
import { TournamentModule } from "../../../modules/tournament/tournament.module.js";
import { InternalTournamentController } from "./internal-tournament.controller.js";
import { UserModule } from "../../../modules/user/user.module.js";
import { InternalLobbyGuard } from "../lobby/internal-lobby.guard.js";

@Module({
  imports: [TournamentModule, UserModule],
  providers: [InternalLobbyGuard],
  controllers: [InternalTournamentController],
})
export class InternalTournamentModule {}
