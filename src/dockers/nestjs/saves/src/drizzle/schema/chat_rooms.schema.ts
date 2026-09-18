import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from 'uuid'


export enum ChatRoomType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export const chatRoomTypeEnum = pgEnum("chat_room_type", ChatRoomType);

export const chat_rooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  roomName: varchar("room_name", {length: 100}),
  type: chatRoomTypeEnum("type").default(ChatRoomType.PRIVATE).notNull(),
  createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull()
})