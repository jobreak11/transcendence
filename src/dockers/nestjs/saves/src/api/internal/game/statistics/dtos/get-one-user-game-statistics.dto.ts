import { OmitType } from "@nestjs/swagger";
import { UserGameStatisticDto } from "../../../../../infrastructure/drizzle/schema/user_game_statistics/user_game_statistics.dto.js";


export class GetOneUserGameStatisticsDto extends OmitType(UserGameStatisticDto, ['userId'] as const) {

}