import { ApiProperty } from "@nestjs/swagger";


export class RefreshTokenSuccessDto {
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

}