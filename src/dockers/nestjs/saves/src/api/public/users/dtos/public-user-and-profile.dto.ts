import { ApiProperty, OmitType } from "@nestjs/swagger";
import { UserProfilePublicDto, UserPublicDto } from "./public-user-and-profile-and-title.dto.js";


class UserProfilePublicNoActiveTitleDto extends OmitType(UserProfilePublicDto, ['activeTitle'] as const){

}

export class PublicUserAndProfileDto extends OmitType(UserPublicDto, ['userProfile'] as const){

    @ApiProperty({
        description: "the user profiel details",
        type: () => UserProfilePublicNoActiveTitleDto
    })
    userProfile: UserProfilePublicNoActiveTitleDto;

}