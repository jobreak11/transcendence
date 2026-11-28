import { Module } from "@nestjs/common";
import { UsersApiService } from "./users-api.service.js";
import { UsersApiRedisService } from "./redis/users-api-redis.service.js";
import { UsersApiDatabaseService } from "./database/users-api-database.service.js";
import { UsersApiCachingService } from "./caching/users-api-caching.service.js";
import { DrizzleModule } from "../../infrastructure/drizzle/drizzle.module.js";
import { UserModule } from "../user/user.module.js";

@Module({
    imports: [
        DrizzleModule,
        UserModule
    ],
    providers: [
        UsersApiService,
        UsersApiRedisService,
        UsersApiDatabaseService,
        UsersApiCachingService
    ],
    exports: [
        UsersApiService
    ]
})
export class UsersApiModule {

}