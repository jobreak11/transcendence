import { ApiProperty, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator'
import { UserDto } from './user.dto.js';
import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.url().optional(),
})

export class CreateUserDto extends IntersectionType(
  PickType(UserDto, ['email', 'password'] as const),
  PartialType(PickType(UserDto, ['displayName', 'avatarUrl'] as const))
) 
{
}
