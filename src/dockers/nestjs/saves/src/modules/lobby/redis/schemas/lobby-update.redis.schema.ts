import z from "zod";
import { Lobby } from "./lobby.redis.schema.js";
import { LobbyCreate } from "./lobby-create.redis.schema.js";

export const lobbyUpdateSchema = LobbyCreate.schema.input.omit({
  details: true
})
