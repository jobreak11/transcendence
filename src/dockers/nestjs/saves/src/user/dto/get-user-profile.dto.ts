import { ApiProperty } from "@nestjs/swagger";

export class GetUserProfileDto {

  @ApiProperty({
    example: 'user@example.com',
    description: 'your email'
  })
  email: string;

  @ApiProperty({
    example: 'Date something dunno',
    description: 'date that your account was created'
  })
  createdAt: Date;

  @ApiProperty({
    example: '/asdf/sdf/asdf.asdf',
    description: 'your url to retrieve image of your avatar'
  })
  avatarUrl: string;
};
