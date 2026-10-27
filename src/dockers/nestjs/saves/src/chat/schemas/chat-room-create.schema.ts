import z from "zod";
import { chatRoomsSchema, ChatRoomVisibilityType } from "../../drizzle/schema/chat_rooms/chat_rooms.schema.js";

const baseChatRoomCreateSchema = chatRoomsSchema.select
.omit({
  id: true,
}).extend({
  createdByUserId: z.uuid().nullable(),
  isTemporary: z.boolean()
});

const insertChatRoomCreateSchema = z.object({
  ...baseChatRoomCreateSchema.shape,
  roomName: baseChatRoomCreateSchema.shape.roomName.default(null),
  createdByUserId: baseChatRoomCreateSchema.shape.createdByUserId.default(null),
  visibilityType: baseChatRoomCreateSchema.shape.visibilityType.default(ChatRoomVisibilityType.PRIVATE),
  createdAt: baseChatRoomCreateSchema.shape.createdAt.default(new Date()),
  isTemporary: baseChatRoomCreateSchema.shape.isTemporary.default(false)
})

const inputChatRoomCreateSchema = baseChatRoomCreateSchema.omit({
  createdAt: true
});


export const chatRoomCreateSchema = {
  full: baseChatRoomCreateSchema,
  insert: insertChatRoomCreateSchema,
  input: inputChatRoomCreateSchema
}