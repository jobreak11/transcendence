import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { AchievementDto } from "../../../../infrastructure/drizzle/schema/achievements/achievements.dto.js";
import { TitleDto } from "../../../../modules/titles/title.dto.js";
import { TrophyDto } from "../../../../infrastructure/drizzle/schema/throphies/trophies.dto.js";

class TitleNoIdDto extends OmitType(TitleDto, ['id'] as const) {}
class TrophyNoIdDto extends OmitType(TrophyDto, ['id'] as const) {}

export class GetAchievementDto extends AchievementDto {

    @ApiProperty({
        description: "the title details",
        nullable: true,
        type: () => TitleNoIdDto
    })
    title: TitleNoIdDto | null;

    @ApiProperty({
        description: "the trophy details",
        nullable: true,
        type: () => TrophyNoIdDto
    })
    trophy: TrophyNoIdDto | null;
}
