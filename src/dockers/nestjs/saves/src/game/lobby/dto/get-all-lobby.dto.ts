import { IntersectionType, PickType } from "@nestjs/swagger";
import { LobbyDto } from "./lobby.dto.js";

class _GetAllLobbyDtoBase extends PickType(
  LobbyDto,
  [
    'roomPinId',
    'catchPhrase',
  ]
) {

}