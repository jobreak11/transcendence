import { Module } from "@nestjs/common";
import { InternalGameStatisticsUserController } from "./internal-game-statistics-user.controller.js";
import { InternalGameStatisticsDeveloperController } from "./internal-game-statistics-developer.controller.js";
import { GameStatisticsModule } from "../../../../modules/game-statistics/game-statistics.module.js";
import { InternalGameStatisticsService } from "./internal-game-statistics.service.js";

@Module({
    imports: [
        GameStatisticsModule
    ],
    providers: [
        InternalGameStatisticsService
    ],
    controllers: [
        InternalGameStatisticsUserController,
        InternalGameStatisticsDeveloperController
    ]
})
export class InternalGameStatisticsModule {

}