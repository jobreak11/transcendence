import { Module } from "@nestjs/common";
import { InternalGameStatisticsUserController } from "./internal-game-statistics-user.controller.js";
import { InternalGameStatisticsDeveloperController } from "./internal-game-statistics-developer.controller.js";
import { GameStatisticsModule } from "../../../../modules/game-statistics/game-statistics.module.js";
import { InternalGameStatisticsService } from "./internal-game-statistics.service.js";
import { PublicUsersStatisticsModule } from "../../../public/users-statistics/public-users-statistics.module.js";
import { PublicUsersModule } from "../../../public/users/public-users.module.js";

@Module({
    imports: [
        GameStatisticsModule,
        PublicUsersStatisticsModule,
        PublicUsersModule,
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