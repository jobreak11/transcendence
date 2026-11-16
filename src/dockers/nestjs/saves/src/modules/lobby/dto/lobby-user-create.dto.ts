import z from "zod";
import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyUserCreateSchema } from "../schemas/lobby-user-create.schema.js";
import { LobbyGeneralSettingsDto } from "../redis/dtos/lobby-generalSettings.dto.js";
import { LobbyGameSettingsDto } from "../redis/dtos/lobby-gameSettings.dto.js";
import { LobbyRoomType } from "../redis/schemas/lobby-generalSettings.redis.schema.js";

type testType = z.input<typeof LobbyUserCreateSchema>;

class generalBase1 extends OmitType(LobbyGeneralSettingsDto, ['roomType'] as const) {
  @ApiProperty({
    description: "the lobby room type ",
    enum: [LobbyRoomType.PUBLIC, LobbyRoomType.PRIVATE],
    example: LobbyRoomType.PUBLIC
  })
  roomType: Exclude<LobbyRoomType, LobbyRoomType.RANKED | LobbyRoomType.TOURNAMENT>
}

class generalBase extends IntersectionType(
  PartialType(generalBase1),
) {

}

class generalBase2 extends IntersectionType(
  PartialType(LobbyGeneralSettingsDto)
) {

}

class gameBase extends IntersectionType(
  PartialType(OmitType(LobbyGameSettingsDto, ['ante'] as const))
) {

}

export class LobbyUserFullCreateDto implements testType {

  @ApiProperty({
    type: generalBase2,
    description: "the general setting of the lobby room"
  })
  generalSettings: generalBase2;

  @ApiProperty({
    description: "game settings",
    type: gameBase
  })
  gameSettings: gameBase;

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