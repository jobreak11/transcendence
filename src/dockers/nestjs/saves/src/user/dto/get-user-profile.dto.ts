import { ApiProperty, IntersectionType, OmitType, PartialType } from "@nestjs/swagger";
import { UserDto } from "../../drizzle/schema/users/user.dto.js";
import { UserProfileDto } from "../../drizzle/schema/user_profiles/user-profile.dto.js";
import z from "zod";
import { userSchema } from "../../drizzle/schema/users/users.schema.js";
import { userProfileSchema } from "../../drizzle/schema/user_profiles/user_profiles.schema.js";


//class _GetUserProfileDtoBase extends IntersectionType(
//  OmitType(UserDto, ['id', 'password', 'hashedRefreshToken'] as const),
//  //OmitType(UserProfileDto, ['userId'] as const)
//) {

//}

export const getUserProfileSchema = z.object({
  ...userSchema.insert.omit({id: true, password: true, hashedRefreshToken: true}).required().shape,
  titleName: z.string().nullable(),
  user_profile: z.object({
    ...userProfileSchema.insert.omit({userId: true}).required().shape
  })
}).required().strip()


class UserProfileBase extends OmitType(UserProfileDto, ['userId'] as const) {

}

export class GetUserProfileDto extends OmitType(UserDto, ['id', 'password', 'hashedRefreshToken'] as const) {
  @ApiProperty({
    example: "Sheriff",
    description: "The active title name that user use"
  })
  titleName: string | null;

  @ApiProperty({
    type: () => UserProfileBase,
    description: 'the profile details of the user'
  })
  user_profile: UserProfileBase
}

//export class GetUserProfileDto {

//  @ApiProperty({
//    example: "awea-asdfawf-asdfa",
//    description: 'your uuid user'
//  })
//  id: string;

//  @ApiProperty({
//    example: 'user@example.com',
//    description: 'your email'
//  })
//  email: string;

//  @ApiProperty({
//    example: 'Date something dunno',
//    description: 'date that your account was created'
//  })
//  createdAt: Date;

//  @ApiProperty({
//    example: '/asdf/sdf/asdf.asdf',
//    description: 'your url to retrieve image of your avatar'
//  })
//  avatarUrl: string | null;

//  @ApiProperty({
//    example: 'YYMMDD_XXXX',
//    description: 'tagID of the user'
//  })
//  tagId: string;

//  @ApiProperty({
//    example: 'YYMMDD_XXXX',
//    description: 'tag id of the user'
//  })
//  displayName: string | null;

//  pronoun: PronounType | null;



