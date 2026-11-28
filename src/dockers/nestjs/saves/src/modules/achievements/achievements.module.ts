import { Module } from "@nestjs/common";
import { AchievementsCachingService } from "./caching/achievements-caching.service.js";
import { AchievementsDatabaseService } from "./database/achievements-database.service.js";
import { AchievementsRedisService } from "./redis/achievements-redis.service.js";
import { AchievementsService } from "./achievements.service.js";
import { DrizzleModule } from "../../infrastructure/drizzle/drizzle.module.js";
import { UserModule } from "../user/user.module.js";

@Module({
    imports: [
        DrizzleModule,
        UserModule
    ],

    providers: [
        AchievementsCachingService,
        AchievementsDatabaseService,
        AchievementsRedisService,
        AchievementsService
    ],
    exports: [
        AchievementsService
    ]

})
export class AchievementsModule {

}