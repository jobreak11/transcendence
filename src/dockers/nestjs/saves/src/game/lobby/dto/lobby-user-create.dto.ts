import z from "zod";
import { LobbyCreate } from "../../../redis/lobby-redis/schemas/lobby-create.redis.schema.js";
import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyDetailsDto } from "../../../redis/lobby-redis/dtos/lobby-details.dto.js";
import { LobbyUserCreateSchema } from "../schemas/lobby-user-create.schema.js";
import { LobbyGeneralSettingsDto } from "../../../redis/lobby-redis/dtos/lobby-generalSettings.dto.js";
import { LobbyGameSettingsDto } from "../../../redis/lobby-redis/dtos/lobby-gameSettings.dto.js";

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