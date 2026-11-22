import { Module } from "@nestjs/common";
import { InternalGameController } from "./internal-game.controller.js";

@Module({
    controllers: [InternalGameController]

})
export class InternalGameModule {

}