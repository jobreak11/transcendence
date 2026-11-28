import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/drizzle/drizzle.module.js";
import { GameStatisticsDatabaseService } from "./database/game-statistics-database.service.js";
import { GameStatisticsService } from "./game-statistics.service.js";
import { GameStatisticsCachingService } from "./caching/game-statistics-caching.service.js";
import { UserModule } from "../user/user.module.js";

@Module({
    imports: [
        DrizzleModule,
        UserModule
    ],
    providers: [
        GameStatisticsDatabaseService,
        GameStatisticsCachingService,
        GameStatisticsService,
    ],
    exports: [
        GameStatisticsService
    ]

})
export class GameStatisticsModule {

}