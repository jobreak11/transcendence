import { ApiProperty } from "@nestjs/swagger";

export class LobbyMemberDataDto {

  @ApiProperty({
    description: "this user joined at what date and time"
  })
  joinedAt: Date;
}