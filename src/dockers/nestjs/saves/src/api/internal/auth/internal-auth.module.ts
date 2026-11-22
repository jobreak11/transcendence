import { Module } from "@nestjs/common";
import { InternalAuthController } from "./internal-auth.controller.js";
import { UserModule } from "../../../modules/user/user.module.js";
import { AuthModule } from "../../../modules/auth/auth.module.js";

@Module({
  controllers: [
    InternalAuthController
  ],
  imports: [
    AuthModule
  ]
})
export class InternalAuthModule {

}