import z from "zod";
import { LobbyDetails, LobbyRoomStatus } from "../schemas/lobby-details.redis.schema.js";
import { ApiProperty, PickType } from "@nestjs/swagger";

type lobbyDetailsDtoBase = z.infer<typeof LobbyDetails.schema.full>

export class LobbyDetailsDto implements lobbyDetailsDtoBase {

  @ApiProperty({
    description: "the pin id of the lobby room",
    example: "067821"
  })
  roomPinId: string;

  @ApiProperty({
    description: "the date the lobby room was created"
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
    enum: LobbyRoomStatus
  })
  roomStatus: LobbyRoomStatus;

  @ApiProperty({
    description: "the current player in the lobby room"
  })
  currentPlayerCount: number;

  @ApiProperty({
    description: "the chat room id of this lobby room"
  })
  chatRoomId: string;

  @ApiProperty({
    description: "the current spectator count of the lobby room"
  })
  currentSpectatorCount?: number | undefined;
}
