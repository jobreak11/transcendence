import { PartialType, PickType, OmitType, IntersectionType, ApiProperty} from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';
import { UserDto } from '../../drizzle/schema/users/user.dto.js';
import { users, userSchema } from '../../drizzle/schema/users/users.schema.js';
import z, { object } from 'zod';
import { userProfileSchema } from '../../drizzle/schema/user_profiles/user_profiles.schema.js';
import { UserProfileDto } from '../../drizzle/schema/user_profiles/user-profile.dto.js';

export const updateUserSchema = z.object({
  ...userSchema.update.pick({password: true}).shape,
  user_profile: z.object({...userProfileSchema.update.omit({userId: true}).shape}).optional()
}).strict()

type test = z.infer<typeof updateUserSchema>
//export const updateUserSchema = userSchema.update.omit({
//})

// FIXED: must not be able to update email of the user
/*
    If want the user to be able to modify the email also
    we would need re-verify the new email that user needs
    to validate first
 */
//export class UpdateUserDto extends PartialType(OmitType(UserDto,
//  ['id', 'hashedRefreshToken', 'email', 'tagId', 'role', 'createdAt'] as const
//)) {

//}

class BaseUserProfileResponseDto extends OmitType(UserProfileDto, ['userId'] as const) {

}

class BaseUserProfileDto extends PartialType(BaseUserProfileResponseDto) {

}

export class UpdateUserResponseDto extends IntersectionType(
  PickType(UserDto, ['password'] as const),
) {

  @ApiProperty({
    type: () => BaseUserProfileResponseDto,
    description: "the user profile details"
  })
  user_profile: BaseUserProfileResponseDto
}

export class UpdateUserDto extends PartialType(OmitType(UpdateUserResponseDto, ['user_profile'])) {

  @ApiProperty({
    type: () => BaseUserProfileDto,
    description: "the user profile details",
    required: false
  })
  user_profile?: BaseUserProfileDto
}
