import { z } from 'zod';

export const newLobbyChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(1000),
});

export type NewLobbyChatMessageZodDto = z.infer<typeof newLobbyChatMessageSchema>;

export class onLobbyChatMessageResponse {
  lobbyPinId: string;
  senderUserId: string | null;
  message: string | null;
  type: "SYSTEM" | "USER" | null;
}