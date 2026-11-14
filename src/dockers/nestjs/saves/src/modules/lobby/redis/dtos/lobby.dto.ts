import { ApiProperty } from "@nestjs/swagger";
import { Lobby } from "../schemas/lobby.redis.schema.js";
import { LobbyDetailsDto } from "./lobby-details.dto.js";
import { LobbyGameSettingsDto } from "./lobby-gameSettings.dto.js";
import { LobbyGeneralSettingsDto } from "./lobby-generalSettings.dto.js";


export class LobbyDto implements Lobby.FullDto {

  @ApiProperty({
    description: "the details information of the lobby",
    type: () => LobbyDetailsDto
  })
  details: LobbyDetailsDto;

  @ApiProperty({
    description: "the game settings of the lobby",
    type: () => LobbyGameSettingsDto
  })
  gameSettings: LobbyGameSettingsDto;

  @ApiProperty({
    description: "the general settings of the lobby",
    type: () => LobbyGeneralSettingsDto
  })
  generalSettings: LobbyGeneralSettingsDto
}
