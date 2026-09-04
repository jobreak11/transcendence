import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator'

export class CreateUserDto {

  @ApiProperty({example: 'alex@example.com'})
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123'})
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'InwZa007'})
  @IsString()
  @IsOptional()
  displayName?: string;
}
