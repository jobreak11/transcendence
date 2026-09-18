import { index, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { chat_rooms } from "./chat_rooms.schema.js";
import { users } from "./users.schema.js";
import { v7 as uuidv7 } from 'uuid'

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
    messageText: varchar("message_text", {length: 5000}),

    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
  }
  ,
  (t) => [
    // Optimize loading message for a room ordered by newest first
    index("chat_messages_room_idx").on(t.chatRoomId, t.createdAt.desc()),
    // Optimize fetching a user's recent activity
    index("chat_messages_user_idx").on(t.userId),
  ]
)