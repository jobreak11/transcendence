import { Module } from "@nestjs/common";
import { TrophiesModule } from "../../../modules/trophies/trophies.module.js";
import { InternalTrophiesService } from "./internal-trophies.service.js";
import { InternalTrophiesUserController } from "./internal-trophies-user.controller.js";
import { InternalTrophiesDeveloperController } from "./internal-trophies-developer.controller.js";

@Module({
    imports: [TrophiesModule],
    providers: [
        InternalTrophiesService
    ],
    controllers: [
        InternalTrophiesUserController,
        InternalTrophiesDeveloperController
    ],
    exports: [
    ]

})
export class InternalTrophiesModule {

}
