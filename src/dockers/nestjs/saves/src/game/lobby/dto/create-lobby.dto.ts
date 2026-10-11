import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod'
import { GameSettingsDto, GameSettingsSchema } from './game-settings.dto.js';

export enum LobbyRoomType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
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