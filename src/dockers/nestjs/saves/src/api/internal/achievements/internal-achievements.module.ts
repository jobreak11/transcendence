import { Module } from "@nestjs/common";
import { InternalAchievementsController } from "./internal-achievements.controller.js";
import { InternalAchievementsService } from "./internal-achievements.service.js";

@Module({
    imports: [

    ],
    controllers: [
        InternalAchievementsController
    ],
    providers: [
        InternalAchievementsService
    ],
    exports: [

    ]
})
export class InternalAchievementsModule {

}