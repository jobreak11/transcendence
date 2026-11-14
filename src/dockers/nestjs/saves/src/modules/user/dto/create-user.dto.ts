import { ApiProperty, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator'
import { z } from 'zod'
import { userSchema } from '../../../infrastructure/drizzle/schema/users/users.schema.js';
import { userProfileSchema } from '../../../infrastructure/drizzle/schema/user_profiles/user_profiles.schema.js';
import { UserDto } from '../../../infrastructure/drizzle/schema/users/user.dto.js';
import { UserProfileDto } from '../../../infrastructure/drizzle/schema/user_profiles/user-profile.dto.js';


export const createUserSchema = z.object({
  ...userSchema.insert.shape,
  ...userProfileSchema.insert.shape
}).pick({
  email: true,
  password: true,
  displayName: true,
  avatarUrl: true
})

type test = z.infer<typeof createUserSchema>

export class CreateUserDto extends IntersectionType(
  PickType(UserDto, ['email', 'password'] as const),
  PartialType(PickType(UserProfileDto, ['displayName', 'avatarUrl'] as const))
) 
{
}
