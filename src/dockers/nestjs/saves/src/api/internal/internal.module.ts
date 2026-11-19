import { Module } from "@nestjs/common";
import { InternalUsersModule } from "./users/internal-users.module.js";
import { InternalAuthModule } from "./auth/internal-auth.module.js";
import { InternalTitlesModule } from "./titles/internal-titles.modules.js";
import { InternalChatModule } from "./chat/internal-chat.module.js";
import { InternalFriendsModule } from "./friends/internal-friends.module.js";
import { InternalLobbyModule } from "./lobby/internal-lobby.module.js";
import { InternalGameModule } from "./game/internal-game.module.js";
import { InternalGameMatchesModule } from "./game/matches/internal-game-matches.module.js";
import { InternalGameStatisticsModule } from "./game/statistics/internal-game-statistics.module.js";
import { InternalTrophiesModule } from "./trophies/internal-trophies.module.js";
import { InternalAchievementsModule } from "./achievements/internal-achievements.module.js";
import { InternalUsersApiModule } from "./users-api/internal-users-api.module.js";

@Module({
  imports: [
    InternalAuthModule,
    InternalUsersModule,
    InternalTitlesModule,
    InternalChatModule,
    InternalFriendsModule,
    InternalLobbyModule,
    InternalGameModule,
    InternalGameMatchesModule,
    InternalGameStatisticsModule,
    InternalTrophiesModule,
    InternalAchievementsModule,
    InternalUsersApiModule
  ]
})
export class InternalModule {

}
