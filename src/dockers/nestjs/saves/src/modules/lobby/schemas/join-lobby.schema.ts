import z from "zod";

export const joinLobbySchema = z.object({
  lobbyPinId: z.string().min(6).length(6),
  isSpectator: z.boolean().default(false),
  password: z.string().min(1).max(1000).optional()
})