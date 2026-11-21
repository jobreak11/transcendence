import { index, pgEnum, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "../users/users.schema.js";
import { v7 as uuidv7 } from 'uuid'
import { z } from 'zod'
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { updateUserSchema } from "../../../user/dto/update-user.dto.js";
import { chat_rooms } from "../chat_rooms/chat_rooms.schema.js";

export const MESSAGE_LENGTH_LIMIT = 5000;

export enum ChatMessageType {
  USER_MESSAGE = "USER_MESSAGE",
  SYSTEM_MESSAGE = "SYSTEM_MESSAGE"
}

export const chatMessageTypeEnum = pgEnum("chat_message_type", ChatMessageType);

export const chat_messages = pgTable("chat_messages",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),

    chatRoomId: uuid("chat_room_id")
      .notNull()
      .references(() => chat_rooms.id, {onDelete: "cascade"}),

    userId: uuid("user_id")
      .references(() => users.id, {onDelete: "set null"}),

    // Hard limit the message text to avoid someone sending too large text
    messageText: varchar("message_text", {length: MESSAGE_LENGTH_LIMIT}).notNull(),

    type: chatMessageTypeEnum("type").default(ChatMessageType.USER_MESSAGE).notNull(),

    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
  }
  ,
  (t) => [
    // Optimize loading message for a room ordered by newest first
    index("chat_messages_room_created_idx").on(t.chatRoomId, t.createdAt.desc()),
    // Optimize fetching a user's recent activity
    index("chat_messages_user_idx").on(t.userId),
  ]
)

const selectSchema = createSelectSchema(chat_messages, {
  id: z.uuid(),
  chatRoomId: z.uuid(),
  userId: z.uuid().nullable(),
  messageText: (schema) => schema.trim().min(1).max(MESSAGE_LENGTH_LIMIT),
  type: z.enum(ChatMessageType),
  createdAt: z.coerce.date()
});

export const chatMessagesDatabaseSchema = {
  select: selectSchema,
  insert: createInsertSchema(chat_messages)
}
