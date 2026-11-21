import z from "zod";
import { joinLobbySchema } from "../schemas/join-lobby.schema.js";
import { ApiProperty } from "@nestjs/swagger";

type joinLobbyDtoBase = z.infer<typeof joinLobbySchema>


export class JoinLobbyDto implements joinLobbyDtoBase {

  @ApiProperty({
    description: "lobby pin id",
    example: "149234"
  })
  lobbyPinId: string;

  @ApiProperty({
    description: "to join as spectator or not",
    example: false
  })
  isSpectator: boolean;

  @ApiProperty({
    description: "password of the lobby room if needed"
  })
  password?: string | undefined;
}