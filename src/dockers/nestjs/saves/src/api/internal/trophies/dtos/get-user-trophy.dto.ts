import { ApiProperty, OmitType } from "@nestjs/swagger";
import { UserTrophyDto } from "../../../../infrastructure/drizzle/schema/user_trophies/user_trophies.dto.js";
import { TrophyDto } from "../../../../infrastructure/drizzle/schema/throphies/trophies.dto.js";

class UserTrophyNoIdDto extends OmitType(UserTrophyDto, ['trophyId', 'userId'] as const) {

}

export class GetUserTrophyDto extends UserTrophyNoIdDto {


    @ApiProperty({
        description: "the trophy details",
        type: () => TrophyDto
    })
    trophy: TrophyDto;

}