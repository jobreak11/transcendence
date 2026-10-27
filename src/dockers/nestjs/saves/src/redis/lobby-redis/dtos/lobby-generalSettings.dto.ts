import z from "zod";
import { LobbyGeneralSettings, LobbyRoomType } from "../schemas/lobby-generalSettings.redis.schema.js";
import { ApiProperty} from "@nestjs/swagger";

type lobbyGeneralSettingsDtoBase = z.infer<typeof LobbyGeneralSettings.schema.full>;

export class LobbyGeneralSettingsDto implements lobbyGeneralSettingsDtoBase {

  @ApiProperty({
    description: "the catchphrase of the room",
    example: "hell newbie welcome"
  })
  catchPhrase: string | null;

  @ApiProperty({
    description: "the lobby room type ",
    enum: LobbyRoomType,
    example: LobbyRoomType.PUBLIC
  })
  roomType: LobbyRoomType;

  @ApiProperty({
    description: "the password of the room",
    example: "veryStringPassword1234"
  })
  password: string | null;
}