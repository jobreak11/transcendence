import { ApiProperty, OmitType } from "@nestjs/swagger";
import { GetAchievementDto } from "./get-achievement.dto.js";
import { UserAchievementDto } from "../../../../infrastructure/drizzle/schema/user_achievements/user_achievements.dto.js";

class GetAchievementNoIdDto extends OmitType(GetAchievementDto, ['id'] as const) {}

export class GetUserAchievementDto extends UserAchievementDto {

    @ApiProperty({
        description: "the achievement data",
        type: () => GetAchievementNoIdDto
    })
    achievement: GetAchievementNoIdDto;

}