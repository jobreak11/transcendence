import { Module } from "@nestjs/common";
import { InternalUsersModule } from "./users/internal-users.module.js";
import { InternalAuthModule } from "./auth/internal-auth.module.js";
import { InternalTitlesModule } from "./titles/internal-titles.modules.js";
import { InternalChatModule } from "./chat/internal-chat.module.js";
import { InternalFriendsModule } from "./friends/internal-friends.module.js";
import { InternalLobbyModule } from "./lobby/internal-lobby.module.js";
import { InternalGameModule } from "./game/internal-game.module.js";
import { InternalTournamentModule } from "./tournament/internal-tournament.module.js";

@Module({
  imports: [
    InternalAuthModule,
    InternalUsersModule,
    InternalTitlesModule,
    InternalChatModule,
    InternalFriendsModule,
    InternalLobbyModule,
    InternalGameModule,
    InternalTournamentModule,
    
  ]
})
export class InternalModule {

}
