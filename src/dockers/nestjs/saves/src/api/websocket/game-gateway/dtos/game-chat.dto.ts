import { z } from "zod";
import { pokerTableIdSchema } from "./poker-action.dto.js";

export const gameChatHistorySchema = z.object({
  tableSessionId: pokerTableIdSchema,
});

export const gameChatMessageSchema = z.object({
  tableSessionId: pokerTableIdSchema,
  messageText: z.string().trim().min(1).max(5000),
});

export type GameChatHistoryDto = z.infer<typeof gameChatHistorySchema>;
export type GameChatMessageDto = z.infer<typeof gameChatMessageSchema>;
