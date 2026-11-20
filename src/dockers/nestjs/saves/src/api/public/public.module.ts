import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller.js";
import { UsersApiModule } from "../../modules/users-api/users-api.module.js";

@Module({
  imports: [
    UsersApiModule
  ],
  controllers: [
    PublicController
  ],
})
export class PublicModule {

}