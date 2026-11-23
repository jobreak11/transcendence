import { ApiProperty, OmitType } from "@nestjs/swagger";
import { UserGameStatisticDto } from "../../../../infrastructure/drizzle/schema/user_game_statistics/user_game_statistics.dto.js";
import { UserProfileDto } from "../../../../infrastructure/drizzle/schema/user_profiles/user-profile.dto.js";
import { UserDto } from "../../../../infrastructure/drizzle/schema/users/user.dto.js";


class PublicUserProfileNoUserId extends OmitType(UserProfileDto, ['userId'] as const) {

}

class PublicUserNoIdWithProfile extends OmitType(UserDto, ['id', 'hashedRefreshToken', 'password'] as const) {

    @ApiProperty({
        description: "the profile detail of the current user",
        type: () => PublicUserProfileNoUserId
    })
    userProfile: PublicUserProfileNoUserId;

}

export class PublicUserStatDto extends UserGameStatisticDto { 

    @ApiProperty({
        description: "the user infomation",
        type: () => PublicUserNoIdWithProfile
    })
    user: PublicUserNoIdWithProfile;
}
