import { Module } from "@nestjs/common";
import { UserModule } from "../../../modules/user/user.module.js";
import { TitlesModule } from "../../../modules/titles/titles.module.js";
import { InternalUsersUserController } from "./internal-users-user.controller.js";
import { InternalUsersDeveloperController } from "./internal-users-developer.controller.js";

@Module({
  imports: [
    UserModule,
    TitlesModule
  ],
  controllers: [
    InternalUsersUserController,
    InternalUsersDeveloperController
  ]
})
export class InternalUsersModule {

}