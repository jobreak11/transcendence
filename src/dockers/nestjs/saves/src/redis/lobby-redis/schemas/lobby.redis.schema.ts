import z from "zod";
import { LobbyGeneralSettings } from "./lobby-generalSettings.redis.schema.js";
import { LobbyDetails } from "./lobby-details.redis.schema.js";
import { LobbyGameSettings } from "./lobby-gameSettings.redis.schema.js";

const baseLobbySchema = z.object({
  generalSettings: LobbyGeneralSettings.schema.full,
  details: LobbyDetails.schema.full,
  gameSettings: LobbyGameSettings.schema.full
})

const insertLobbySchema = z.object({
  generalSettings: LobbyGeneralSettings.schema.full,
  details: LobbyDetails.schema.insert,
  gameSettings: LobbyGameSettings.schema.insert,
})

const inputLobbySchema = z.object({
  generalSettings: LobbyGeneralSettings.schema.input,
  details: LobbyDetails.schema.input,
  gameSettings: LobbyGameSettings.schema.insert,

})

export namespace Lobby {

  export type FullDto = z.infer<typeof baseLobbySchema>;

  export const schema = {
    insert: insertLobbySchema,
    full: baseLobbySchema,
    input: inputLobbySchema
  }
}