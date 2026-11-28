import { ApiProperty } from "@nestjs/swagger";

export class GetLobbyMemberListPublicDto {
  @ApiProperty({
    description: "Display names of the lobby players",
    type: [String],
  })
  playerList: string[];

  @ApiProperty({
    description: "Display names of the lobby spectators",
    type: [String],
  })
  spectatorList: string[];

  @ApiProperty({
    description: "Display names of lobby players who are ready",
    type: [String],
  })
  readyPlayerList: string[];
}
