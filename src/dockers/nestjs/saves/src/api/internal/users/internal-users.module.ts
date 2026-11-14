import { Module } from "@nestjs/common";
import { InternalUsersController } from "./internal-users.controller.js";
import { UserModule } from "../../../modules/user/user.module.js";
import { TitlesModule } from "../../../modules/titles/titles.module.js";

@Module({
  imports: [
    UserModule,
    TitlesModule
  ],
  controllers: [
    InternalUsersController
  ]
})
export class InternalUsersModule {

}