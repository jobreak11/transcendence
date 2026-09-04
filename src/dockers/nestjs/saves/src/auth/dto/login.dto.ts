import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email registered to the account',
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The plain-text user password.'
  })
  password: string;
}

export class LoginSuccessResponseDto {

  @ApiProperty({
    example: 1,
    description: 'The authenticated user ID'
  })
  id: number;

  @ApiProperty({
    example: 'lsd234k5j5234k5lj1kj2h3g4341k2313kl2j2h4...',
    description: 'Signed JWT access token'
  })
  token: string;

  @ApiProperty({
    example: 'egrsa9876sgb9788sbhuisdfhoui...',
    description: 'Refresh JWT token'
  })
  refreshToken: string;
}

export class UnauthorizedErrorDto {

  @ApiProperty({
    example: 401,
    description: 'Http error status code'
  })
  statusCode: number;

  @ApiProperty({
    example: 'Unauthorized'
  })
  message: string;
}
