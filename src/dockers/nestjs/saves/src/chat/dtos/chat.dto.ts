import { z } from "zod"
import { ChatRoomVisibilityType } from "../../drizzle/schema/chat_rooms/chat_rooms.schema.js";

export const CreateChatRoomSchema = z.object({
  roomName: z.string().max(100).optional(),
  type: z.enum([ ChatRoomVisibilityType.PRIVATE]).default(ChatRoomVisibilityType.PRIVATE),
})

export type CreateChatRoomZodDto = z.infer<typeof CreateChatRoomSchema>;

export const InviteUserToChatRoomSchema = z.object({
  chatRoomId: z.uuid(),
  targetUserId: z.uuid(),
  role: z.enum(ChatRoomMemberRole).optional()
});

export type InviteUserToChatRoomZodDto = z.infer<typeof InviteUserToChatRoomSchema>;

export const KickUserChatRoomSchema = z.object({
  chatRoomId: z.uuid(),
  targetUserId: z.uuid()
});

export type KickUserChatRoomZodDto = z.infer<typeof KickUserChatRoomSchema>;
