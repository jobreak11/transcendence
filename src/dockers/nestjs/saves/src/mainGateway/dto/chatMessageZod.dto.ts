
import { z } from 'zod'

export const newChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  chatRoomId: z.uuid(),
});


export type NewChatMessageZodDto = z.infer<typeof newChatMessageSchema>;

export class onChatMessageResponse {
  senderUserId: string | null;
  chatRoomId: string;
  message: string | null;
  createdAt: Date;
  type: string | null;

}
