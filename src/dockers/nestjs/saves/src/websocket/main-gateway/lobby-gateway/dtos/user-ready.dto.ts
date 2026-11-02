import z from "zod";

export const UserReadyToServerSchema = z.object({
  lobbyPinId: z.string().min(6).max(6)
})

export type UserReadyToServerDto = z.infer<typeof UserReadyToServerSchema>;

export interface UserReadyToClientDto {
  lobbyPinId: string,
  userId: string,
  isReady: boolean,
  createdAt: Date
}

