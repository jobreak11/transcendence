import { ApiProperty } from "@nestjs/swagger";
import { UserProfileDto } from "../../drizzle/schema/user_profiles/user-profile.dto.js";
import { UserDto } from "../../drizzle/schema/users/user.dto.js";

export class UserAndProfileDto extends UserDto {
  @ApiProperty({
    type: () => UserProfileDto,
    description: "the profile details of the user",
    nullable: true
  })
  user_profile: UserProfileDto | null;
}