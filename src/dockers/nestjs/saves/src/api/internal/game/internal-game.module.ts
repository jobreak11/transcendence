import { Module } from "@nestjs/common";
import { InternalGameController } from "./internal-game.controller.js";
import { InternalGameMatchesModule } from "./matches/internal-game-matches.module.js";
import { InternalGameStatisticsModule } from "./statistics/internal-game-statistics.module.js";

@Module({
    controllers: [InternalGameController]

})
export class InternalGameModule {

}