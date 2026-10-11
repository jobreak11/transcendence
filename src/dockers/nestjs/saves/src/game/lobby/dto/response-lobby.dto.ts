import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyDto } from "./lobby.dto.js";

export class ResponseLobbyDto extends IntersectionType (
  PickType(
    LobbyDto,
    [
      'roomPinId',
    ]
  ),
  PartialType(PickType(
    LobbyDto,
    [
      'catchPhrase',
      'createdAt',
      'roomType',
      'roomStatus',
      'hostUserId',
      'currentPlayerCount',
      'currentSpectatorCount',
      'gameSettings',
    ]
  ))
) {

}