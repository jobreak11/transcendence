import { Module } from "@nestjs/common";
import { InternalTitlesController } from "./internal-titles.controller.js";
import { TitlesModule } from "../../../modules/titles/titles.module.js";

@Module({
  controllers: [
    InternalTitlesController
  ],
  imports: [
    TitlesModule
  ]
})
export class InternalTitlesModule {

}