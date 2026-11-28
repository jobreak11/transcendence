import { ApiProperty } from "@nestjs/swagger";
import { GameMatchDto } from "../../../../../infrastructure/drizzle/schema/game_matches/game_matches.dto.js";
import { UserGameMatchDto } from "../../../../../infrastructure/drizzle/schema/user_game_matches/user_game_matches.dto.js";



export class GetAllGameMatchDto extends GameMatchDto {

	@ApiProperty({
		description: "per user detail of this match",
		type: () => UserGameMatchDto,
		isArray: true,
	})
	userGameMatches: UserGameMatchDto[];


}