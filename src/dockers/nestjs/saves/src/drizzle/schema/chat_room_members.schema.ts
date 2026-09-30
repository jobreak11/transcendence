import { check, index, pgEnum, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { chat_rooms } from "./chat_rooms.schema.js";
import { users } from "./users.schema.js";

export enum ChatRoomMemberRole {
  MEMBER = 'MEMBER',
  OWNER = 'OWNER',
  SPECTATOR = 'SPECTATOR',
}

export const chatRoomMemberRoleEnum = pgEnum("chat_room_member_role", ChatRoomMemberRole);

export const chat_room_members = pgTable("chat_room_members",
  {
    chatRoomId: uuid("chat_room_id")
      .notNull()
      .references(() => chat_rooms.id, {onDelete: "cascade"}),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),

    role: chatRoomMemberRoleEnum("role").default(ChatRoomMemberRole.MEMBER).notNull(),
    joinedAt: timestamp("joined_at", {withTimezone: true}).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({columns: [t.chatRoomId, t.userId]}),
    index("chat_room_user_idx").on(t.userId),
  ]
)