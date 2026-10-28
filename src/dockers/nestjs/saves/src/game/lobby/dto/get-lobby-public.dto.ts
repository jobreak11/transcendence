import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyDto } from "../../../redis/lobby-redis/dtos/lobby.dto.js";
import { LobbyDetailsDto } from "../../../redis/lobby-redis/dtos/lobby-details.dto.js";
import { LobbyGameSettingsDto } from "../../../redis/lobby-redis/dtos/lobby-gameSettings.dto.js";
import { LobbyGeneralSettingsDto } from "../../../redis/lobby-redis/dtos/lobby-generalSettings.dto.js";

class LobbyGeneralSettingsPublicDto extends IntersectionType (
  OmitType(LobbyGeneralSettingsDto, ['password'] as const)
) {

}

class LobbyDetailsPublicDto extends IntersectionType(
  OmitType(LobbyDetailsDto, ['chatRoomId'] as const)
) {
}

export class GetLobbyPublicDto {

  @ApiProperty({
    type: () => LobbyDetailsPublicDto
  })
  details: LobbyDetailsPublicDto;

  @ApiProperty({
    type: () => LobbyGameSettingsDto
  })
  gameSettings: LobbyGameSettingsDto;

  @ApiProperty({
    type: () => LobbyGeneralSettingsPublicDto
  })
  generalSettings: LobbyGeneralSettingsPublicDto;

}

