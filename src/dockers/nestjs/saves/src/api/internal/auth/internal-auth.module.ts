import { Module } from "@nestjs/common";
import { InternalAuthController } from "./internal-auth.controller.js";
import { UserModule } from "../../../modules/user/user.module.js";
import { AuthModule } from "../../../modules/auth/auth.module.js";
import { TitlesModule } from "../../../modules/titles/titles.module.js";
import { InternalAuthService } from "./internal-auth.service.js";

@Module({
  controllers: [
    InternalAuthController
  ],
  providers: [
    InternalAuthService
  ],
  imports: [
    AuthModule,
    TitlesModule,
    UserModule
  ]
})
export class InternalAuthModule {

}