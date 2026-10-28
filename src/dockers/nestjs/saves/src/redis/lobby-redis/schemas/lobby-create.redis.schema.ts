import z from "zod";
import { LobbyDetails } from "./lobby-details.redis.schema.js";
import { LobbyGeneralSettings } from "./lobby-generalSettings.redis.schema.js";
import { LobbyGameSettings } from "./lobby-gameSettings.redis.schema.js";

const inputlobbyCreateSchema = z.object({
  details: LobbyDetails.schema.input,
  generalSettings: LobbyGeneralSettings.schema.input,
  gameSettings: LobbyGameSettings.schema.input
})


export namespace LobbyCreate {

  export type InputDto = z.input<typeof inputlobbyCreateSchema>;

  export const schema = {
    input: inputlobbyCreateSchema
  }

}
