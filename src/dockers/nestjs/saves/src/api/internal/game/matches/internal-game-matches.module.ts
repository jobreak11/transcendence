import { Module } from "@nestjs/common";
import { InternalGameMatchesService } from "./internal-game-matches.service.js";

@Module({
    controllers: [
    ],
    providers: [
        InternalGameMatchesService
    ]
})
export class InternalGameMatchesModule {

}