import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod'

export enum GameSettingFormat {
  BEGINNER = "BEGINNER",
  PRO = "PRO",
  TURBO = "TURBO",
}

export const GameSettingsSchema = z.object({
  maxPlayer: z.int().min(2).max(8),
  maxSpectator: z.int().min(0).max(10).default(0),
  format: z.enum(GameSettingFormat).default(GameSettingFormat.BEGINNER),
})

type _GameSettingsZodDtoBase = z.infer<typeof GameSettingsSchema>;

export class GameSettingsDto implements _GameSettingsZodDtoBase {

  @ApiProperty({
    example: "4",
    description: "the max number of player to game in the game",
    type: Number
  })
  maxPlayer: number;

  @ApiProperty({
    description: "the max number of spectator to watch this game",
    example: "2",
    type: Number
  })
  maxSpectator: number;

  @ApiProperty({
    enum: GameSettingFormat,
    example: GameSettingFormat.BEGINNER,
    description: "the format to play in this lobby"
  })
  format: GameSettingFormat;
}
