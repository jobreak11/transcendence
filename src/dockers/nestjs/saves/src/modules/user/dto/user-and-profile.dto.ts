import { ApiProperty } from "@nestjs/swagger";
import { UserProfileDto } from "../../../infrastructure/drizzle/schema/user_profiles/user-profile.dto.js";
import { UserDto } from "../../../infrastructure/drizzle/schema/users/user.dto.js";

export class UserAndProfileDto extends UserDto {
  @ApiProperty({
    type: () => UserProfileDto,
    description: "the profile details of the user",
  })
  user_profile: UserProfileDto;

  // @ApiProperty({
  //   description: "determine whether user is currently online or not"
  // })
  // isUserOnline: boolean;
}