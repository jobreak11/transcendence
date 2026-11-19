import { Module } from "@nestjs/common";
import { UserModule } from "../../../modules/user/user.module.js";
import { TitlesModule } from "../../../modules/titles/titles.module.js";
import { InternalUsersUserController } from "./internal-users-user.controller.js";
import { InternalUsersDeveloperController } from "./internal-users-developer.controller.js";
import { InternalUsersService } from "./internal-users.service.js";

@Module({
  imports: [
    UserModule,
    TitlesModule
  ],
  providers: [
    InternalUsersService
  ],
  controllers: [
    InternalUsersUserController,
    InternalUsersDeveloperController
  ]
})
export class InternalUsersModule {

}