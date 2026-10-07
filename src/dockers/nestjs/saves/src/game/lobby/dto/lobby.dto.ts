import { APP_FILTER } from '@nestjs/core';
import { ApiProperty } from '@nestjs/swagger';
import { number, z } from 'zod'

export enum LobbyRoomType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

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

export const CreateLobbySchema = z.object({
  catchPhrase: z.string().min(1).max(100).nullable().optional(),
  roomType: z.enum(LobbyRoomType).default(LobbyRoomType.PUBLIC),
  password: z.string().min(4).max(100).nullable().optional(),
  gameSettings: GameSettingsSchema
})

type _CreateLobbyZodDtoBase = z.infer<typeof CreateLobbySchema>;

export class CreateLobbyDto implements _CreateLobbyZodDtoBase {

  @ApiProperty({
    description: "the catchphrase that would display when on the lobby list",
    example: "warm up match welcom new player"

  })
  catchPhrase?: string | null | undefined;

  @ApiProperty({
    description: "type of the game room",
    example: LobbyRoomType.PUBLIC
  })
  roomType: LobbyRoomType;

  @ApiProperty({
    description: "the password of the room if the roomType is set \
    to PUBLIC",
    example: "12345687"
  })
  password?: string | null | undefined;

  @ApiProperty({
    type: () => GameSettingsDto,
  })
  gameSettings: GameSettingsDto;
}

export class LobbyDto extends CreateLobbyDto {

  @ApiProperty({
    description: "the room identifier as \
      6 digits base-10 number randomly generated as string. User can use \
      this digit to quick join room",
    example: "020321"
  })
  roomPinId: string;

  @ApiProperty({
    description: "the time this lobby was created"
  })
  createdAt: Date;


  @ApiProperty({
    description: "the user that created this lobby room"
  })
  createdByUserId: string;


  @ApiProperty({
    description: "the host user of the lobby room"
  })
  hostUserId: string;

  @ApiProperty({
    description: "the number of current player in the lobby room"
  })
  currentPlayerCount: number;

  @ApiProperty({
    description: "the number of current spectator in the lobby"
  })
  currentSpectatorCount?: number;
};




