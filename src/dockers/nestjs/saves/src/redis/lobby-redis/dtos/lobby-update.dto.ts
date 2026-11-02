import z from "zod";
import { lobbyUpdateSchema } from "../schemas/lobby-update.redis.schema.js";
import { ApiProperty, IntersectionType, OmitType, PartialType } from "@nestjs/swagger";
import { LobbyGeneralSettingsDto } from "./lobby-generalSettings.dto.js";
import { LobbyGameSettingsDto } from "./lobby-gameSettings.dto.js";
import { APP_FILTER } from "@nestjs/core";


type baseType = z.input<typeof lobbyUpdateSchema>

class baseGeneral extends IntersectionType(
  PartialType(LobbyGeneralSettingsDto)
) {
}

class baseGameSetting extends IntersectionType(
  PartialType(OmitType(LobbyGameSettingsDto, ['ante'] as const))
) {

}

export class LobbyUpdateDto implements baseType {
  @ApiProperty({
    description: "field to update in general settings",
    type: () => baseGeneral
  })
  generalSettings: baseGeneral;

  @ApiProperty({
    description: "field to update in game settings",
    type: () => baseGameSetting
  })
  gameSettings: baseGameSetting;
}
