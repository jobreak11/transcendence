import { ApiProperty, OmitType } from "@nestjs/swagger";
import { GameMatchDto } from "../../../../../infrastructure/drizzle/schema/game_matches/game_matches.dto.js";
import { UserGameMatchDto } from "../../../../../infrastructure/drizzle/schema/user_game_matches/user_game_matches.dto.js";

class UserGameMatchNoGameMatchId extends OmitType(UserGameMatchDto, ['gameMatchId'] as const) {

}

export class FullGameMatchDto extends GameMatchDto {

    @ApiProperty({
        description: "each user match result",
        type: () => UserGameMatchNoGameMatchId,
        isArray: true,
    })
    userMatchResult: UserGameMatchNoGameMatchId[];

}