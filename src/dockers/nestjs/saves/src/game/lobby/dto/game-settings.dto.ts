import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod'


const formatChips = {BEGINER : 2000 , PRO: 5000, TURBO: 5000 };
const formatBB = {BEGINER : 10, PRO: 50, TURBO: 100 };
const Ante = {BEGINNER: null, PRO: 5, TURBO: 10};

export enum GameSettingFormat {
  BEGINNER = "BEGINNER",
  PRO = "PRO",
  TURBO = "TURBO",
  CUSTOM = "CUSTOM"
}

export const GameSettingsSchema = z.object({
  maxPlayer: z.int().min(2).max(8),
  maxSpectator: z.int().min(0).max(10).default(0),
  format: z.enum(GameSettingFormat).default(GameSettingFormat.BEGINNER),
  startingChips: z.int().min(500).max(5000).optional(),
  bigBlind: z.int().min(0).optional(),
  //ante: z.int().min(0).optional(),
}).superRefine((data, ctx) => {

  // if Custom can configure starting chip and bigblind

  //   startingChips  / bigBlind <= 100
  //   startingChips  / bigBlind >= 5
  //    ante = bigBlind / 10

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
