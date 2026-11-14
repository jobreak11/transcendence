import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller.js";

@Module({
  imports: [],
  controllers: [
    PublicController
  ],
})
export class PublicModule {

}