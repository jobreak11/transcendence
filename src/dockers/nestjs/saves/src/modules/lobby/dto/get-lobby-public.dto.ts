import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyGeneralSettingsDto } from "../redis/dtos/lobby-generalSettings.dto.js";
import { LobbyDetailsDto } from "../redis/dtos/lobby-details.dto.js";
import { LobbyGameSettingsDto } from "../redis/dtos/lobby-gameSettings.dto.js";

export class LobbyGeneralSettingsPublicDto extends IntersectionType (
  OmitType(LobbyGeneralSettingsDto, ['password'] as const)
) {

  @ApiProperty({
    description: "whether this lobby require password or not"
  })
  hasPassword: boolean;

}

class LobbyDetailsPublicDto extends IntersectionType(
  // OmitType(LobbyDetailsDto, ['chatRoomId'] as const)
  OmitType(LobbyDetailsDto, [] as const)
) {
  @ApiProperty({
    description: "the host user's display name"
  })
  hostDisplayName: string;
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
