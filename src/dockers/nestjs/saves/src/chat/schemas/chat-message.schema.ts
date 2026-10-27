import z from "zod";
import { chatMessagesDatabaseSchema, ChatMessageType } from "../../drizzle/schema/chat_messages/chat_messages.schema.js";

const baseChatMessageSchema = chatMessagesDatabaseSchema.select
.omit({
  id: true,
  chatRoomId: true,
})

const insertChatMessageSchema = z.object({
  ...baseChatMessageSchema.shape,
  userId: baseChatMessageSchema.shape.userId.optional(),
  type: baseChatMessageSchema.shape.type.optional(),
  createdAt: baseChatMessageSchema.shape.createdAt.default(new Date())
}).transform((data) => {

  const newUserId = data.userId ?? null;
  let newType: ChatMessageType = ChatMessageType.SYSTEM_MESSAGE;
  if (data.type === undefined) {
    if (newUserId) {
      newType = ChatMessageType.USER_MESSAGE;
    }
  }

  return {
    ...data,
    userId: newUserId,
    type: newType
  }
}).refine((data) => {
  if (data.userId && data.type === ChatMessageType.SYSTEM_MESSAGE) {
    return false;
  }
  return true;
})

export const chatMessageSchema = {
  full: baseChatMessageSchema,
  insert: insertChatMessageSchema,
}