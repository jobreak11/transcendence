import { Module } from "@nestjs/common";
import { InternalGameMatchesService } from "./internal-game-matches.service.js";
import { InternalGameMatchesUserController } from "./internal-game-matches-user.controller.js";
import { InternalGameMatchesDeveloperController } from "./internal-game-matches-developer.controller.js";
import { GameModule } from "../../../../modules/game/game.module.js";
import { UserModule } from "../../../../modules/user/user.module.js";

@Module({
    imports: [
        GameModule,
        UserModule
    ],
    controllers: [
        InternalGameMatchesUserController,
        InternalGameMatchesDeveloperController
    ],
    providers: [
        InternalGameMatchesService
    ]
})
export class InternalGameMatchesModule {

}