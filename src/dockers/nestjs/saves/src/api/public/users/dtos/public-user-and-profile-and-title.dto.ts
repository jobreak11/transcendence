import { ApiProperty, OmitType } from "@nestjs/swagger"
import { UserDto } from "../../../../infrastructure/drizzle/schema/users/user.dto.js"
import { UserProfileDto } from "../../../../infrastructure/drizzle/schema/user_profiles/user-profile.dto.js"
import { TitleDto } from "../../../../modules/titles/title.dto.js";


class ActiveTitlePublicDto extends OmitType(TitleDto, ['id'] as const) {

}

export class UserProfilePublicDto extends OmitType(UserProfileDto, ['userId'] as const) {

    @ApiProperty({
        description: "the details of the active public title",
        nullable: true,
        type: () => ActiveTitlePublicDto
    })
    activeTitle: ActiveTitlePublicDto | null;
}

export class UserPublicDto extends OmitType(UserDto, ['hashedRefreshToken', 'password'] as const) {

    @ApiProperty({
        description: "the user profile details",
        type: () => UserProfilePublicDto
    })
    userProfile: UserProfilePublicDto;

}

export class PublicUserAndProfileAndTitleDto extends UserPublicDto {

}