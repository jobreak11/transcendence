import { ApiProperty } from '@nestjs/swagger';
import { CreateLobbyDto } from './create-lobby.dto.js';



export enum LobbyRoomStatus {
  // creating meaning the room is in the initialization process
  // and cannot join yet both player and spectator
  UNAVAILABLE = 'UNAVAILABLE',

  // user can join as player/spectator member when the lobby is waiting
  WAITING = 'WAITING',

  // user cannot join as player to the room that is already playing but
  // can join as spectator
  PLAYING = 'PLAYING'
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
    description: "the current status of the lobby room",
    enum: LobbyRoomStatus,
    example: LobbyRoomStatus.PLAYING,
  })
  roomStatus: LobbyRoomStatus;

  @ApiProperty({
    description: "the number of current player in the lobby room"
  })
  currentPlayerCount: number;

  @ApiProperty({
    description: "the number of current spectator in the lobby"
  })
  currentSpectatorCount?: number;

};
