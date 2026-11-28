import z from "zod";
import { GameSettingFormat, LobbyGameSettings } from "../schemas/lobby-gameSettings.redis.schema.js";
import { ApiProperty } from "@nestjs/swagger";

type lobbyGameSettingsDtoBase = z.infer<typeof LobbyGameSettings.schema.full>
type input = z.input<typeof LobbyGameSettings.schema.input>

export class LobbyGameSettingsDto implements lobbyGameSettingsDtoBase {

  @ApiProperty({
    description: "the max amount of player",
  })
  maxPlayer: number;

  @ApiProperty({
    description: "the max amount of spectator"
  })
  maxSpectator: number;

  @ApiProperty({
    description: "the format of the game",
    enum: GameSettingFormat
  })
  format: GameSettingFormat;
  @ApiProperty({
    description: "the starting chips"
  })
  startingChips: number;

  @ApiProperty({
    description: "the bigblind amount"
  })
  bigBlind: number;

  @ApiProperty({
    description: "the ante amount"
  })
  ante: number | null;
}

