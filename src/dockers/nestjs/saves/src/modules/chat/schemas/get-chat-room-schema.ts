import { chatRoomCreateSchema } from "./chat-room-create.schema.js";

const baseGetChatRoomSchema = chatRoomCreateSchema.full
.omit({
  createdByUserId: true
});

const getChatRoomSchema = {
  full: baseGetChatRoomSchema
}