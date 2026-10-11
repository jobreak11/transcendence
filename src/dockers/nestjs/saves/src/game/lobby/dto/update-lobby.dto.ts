import { OmitType, PartialType, PickType } from "@nestjs/swagger";
import { LobbyDto } from "./lobby.dto.js";
import z from "zod";
import { CreateLobbyDto, CreateLobbySchema } from "./create-lobby.dto.js";

export const UpdateLobbySchema = CreateLobbySchema.partial();

export class UpdateLobbyDto extends CreateLobbyDto {

}