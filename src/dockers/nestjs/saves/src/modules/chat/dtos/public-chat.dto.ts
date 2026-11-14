import { z } from "zod";
import { ChatMessage } from "../../../api/websocket/main-gateway/chat-gateway/dtos/chat-message.dto.js";


const publicChatSchema = ChatMessage.responseSchema.omit({
  chatRoomId: true,
}).extend({
  createdAt: z.date()
})


export type PublicChatMessage = z.infer<typeof publicChatSchema>;
