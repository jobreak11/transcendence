import { OmitType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyDto } from "./lobby.dto.js";
import z from "zod";

export class UpdateLobbyDto extends  PartialType(OmitType(
  LobbyDto,
  [
    'roomPinId',
    'currentPlayerCount',
    'currentSpectatorCount',
    'createdAt',
    'createdByUserId',
    'hostUserId',
    'roomStatus'
  ]
)) {

}