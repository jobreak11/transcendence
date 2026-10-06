import { ApiProperty, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator'
import { UserDto } from './user.dto.js';

export class CreateUserDto extends IntersectionType(
  PickType(UserDto, ['email', 'password']),
  PartialType(PickType(UserDto, ['displayName', 'avatarUrl']))
) {

  //@ApiProperty({example: 'alex@example.com'})
  //@IsString()
  //@IsEmail()
  //email: string;

  //@ApiProperty({ example: 'SecurePassword123'})
  //@IsString()
  //@MinLength(8)
  //password: string;

  //@ApiProperty({ example: 'InwZa007'})
  //@IsString()
  //@IsOptional()
  //displayName?: string;

  //@ApiProperty({
  //  description: 'the url to the profile image of the user'
  //})
  //@IsUrl()
  //@IsOptional()
  //avatarUrl?: string;
}
