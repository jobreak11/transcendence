import { Module } from "@nestjs/common";
import { InternalAchievementsService } from "./internal-achievements.service.js";
import { InternalAchievementsUserController } from "./internal-achievements-user.controller.js";
import { InternalAchievementsDeveloperController } from "./internal-achievements-developer.controller.js";
import { AchievementsModule } from "../../../modules/achievements/achievements.module.js";

@Module({
    imports: [
        AchievementsModule
    ],
    controllers: [
        InternalAchievementsUserController,
        InternalAchievementsDeveloperController
    ],
    providers: [
        InternalAchievementsService
    ],
    exports: [

    ]
})
export class InternalAchievementsModule {

}