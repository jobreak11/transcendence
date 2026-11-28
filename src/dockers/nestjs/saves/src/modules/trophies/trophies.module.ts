import { Module } from "@nestjs/common";
import { TrophiesService } from "./trophies.service.js";
import { TrophiesDatabaseService } from "./database/trophies-database.service.js";
import { TrophiesCachingService } from "./caching/trophies-caching.service.js";
import { TrophiesRedisService } from "./redis/trophies-redis.service.js";
import { DrizzleModule } from "../../infrastructure/drizzle/drizzle.module.js";
import { UserModule } from "../user/user.module.js";

@Module({
    imports: [
        DrizzleModule,
        UserModule
    ],
    providers: [
        TrophiesService,
        TrophiesDatabaseService,
        TrophiesCachingService,
        TrophiesRedisService
    ],
    exports: [
        TrophiesService
    ]
})
export class TrophiesModule {

}