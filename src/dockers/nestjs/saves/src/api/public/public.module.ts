import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller.js";
import { UsersApiModule } from "../../modules/users-api/users-api.module.js";
import { PublicUsersModule } from "./users/public-users.module.js";
import { PublicUsersStatisticsModule } from "./users-statistics/public-users-statistics.module.js";

@Module({
  imports: [
    UsersApiModule,
    PublicUsersModule,
    PublicUsersStatisticsModule
  ],
  controllers: [
    PublicController
  ],
})
export class PublicModule {

}