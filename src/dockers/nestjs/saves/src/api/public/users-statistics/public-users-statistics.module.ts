import { Module } from "@nestjs/common";
import { PublicUsersStatisticsService } from "./public-users-statistics.service.js";
import { UsersApiModule } from "../../../modules/users-api/users-api.module.js";
import { GameStatisticsModule } from "../../../modules/game-statistics/game-statistics.module.js";
import { PublicUsersModule } from "../users/public-users.module.js";
import { PublicUsersStatisticsUserController } from "./public-users-statistics-user.controller.js";

@Module({
    imports: [UsersApiModule, GameStatisticsModule, PublicUsersModule],
    providers: [PublicUsersStatisticsService],
    controllers: [PublicUsersStatisticsUserController]
})
export class PublicUsersStatisticsModule {

}