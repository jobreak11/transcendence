import { ApiProperty } from "@nestjs/swagger";

export class GetLobbyMemberListDto {

  @ApiProperty({
    description: "an array of uuid of the player in the room"
  })
  playerList: string[];

  @ApiProperty({
    description: "an array of uuid of the spectator in the room"
  })
  spectatorList: string[];
};