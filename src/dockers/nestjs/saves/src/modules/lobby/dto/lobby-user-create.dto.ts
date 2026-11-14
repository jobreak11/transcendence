import z from "zod";
import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyUserCreateSchema } from "../schemas/lobby-user-create.schema.js";
import { LobbyGeneralSettingsDto } from "../redis/dtos/lobby-generalSettings.dto.js";
import { LobbyGameSettingsDto } from "../redis/dtos/lobby-gameSettings.dto.js";

type testType = z.input<typeof LobbyUserCreateSchema>;

class generalBase extends IntersectionType(
  PartialType(LobbyGeneralSettingsDto)
) {

}

class gameBase extends IntersectionType(
  PartialType(OmitType(LobbyGameSettingsDto, ['ante'] as const))
) {

}

export class LobbyUserCreateDto implements testType {

  @ApiProperty({
    type: generalBase,
    description: "the general setting of the lobby room"
  })
  generalSettings: generalBase;

  @ApiProperty({
    description: "game settings",
    type: gameBase
  })
  gameSettings: gameBase;

}