import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyDto } from "../../../redis/lobby-redis/dtos/lobby.dto.js";
import { LobbyDetailsDto } from "../../../redis/lobby-redis/dtos/lobby-details.dto.js";
import { LobbyGameSettingsDto } from "../../../redis/lobby-redis/dtos/lobby-gameSettings.dto.js";
import { LobbyGeneralSettingsDto } from "../../../redis/lobby-redis/dtos/lobby-generalSettings.dto.js";

export class LobbyGeneralSettingsPublicDto extends IntersectionType (
  OmitType(LobbyGeneralSettingsDto, ['password'] as const)
) {

  @ApiProperty({
    description: "whether this lobby require password or not"
  })
  hasPassword: boolean;

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

