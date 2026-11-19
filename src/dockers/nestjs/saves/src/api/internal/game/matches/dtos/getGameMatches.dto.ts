import { ApiProperty, OmitType } from "@nestjs/swagger";
import { UserGameMatchDto } from "../../../../../infrastructure/drizzle/schema/user_game_matches/user_game_matches.dto.js";
import { GameMatchDto } from "../../../../../infrastructure/drizzle/schema/game_matches/game_matches.dto.js";

class base1 extends OmitType(UserGameMatchDto, ['userId'] as const) {

}

class GameMatchNoIdDto extends OmitType(GameMatchDto, ['id'] as const) {

}

export class GetGameMatchDto extends base1 {


    @ApiProperty({
        description: "the game match details",
        type: () => GameMatchNoIdDto
    })
    gameMatch: GameMatchNoIdDto;

}