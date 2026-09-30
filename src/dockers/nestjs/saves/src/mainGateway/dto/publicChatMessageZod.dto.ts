import { z } from 'zod';

export const newPublicChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(1000),
});

export type NewPublicChatMessageZodDto = z.infer<typeof newPublicChatMessageSchema>;

export class onPublicChatMessageResponse {
  senderUserId: string | null;
  message: string | null;
  type: "SYSTEM" | "USER" | null;
}