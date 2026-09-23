import { z } from 'zod'

export const newJoinChatRoomSchema = z.object({
  chatRoomId: z.uuid(),
})

export type NewJoinChatRoomZodDto = z.infer<typeof newJoinChatRoomSchema>;

export class onJoinChatRoomResponse {
  status: boolean;
  message?: string;
}