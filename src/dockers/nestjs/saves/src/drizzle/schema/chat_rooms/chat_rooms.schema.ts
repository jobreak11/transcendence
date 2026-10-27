import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { v7 as uuidv7 } from 'uuid'
import z from "zod";


export enum ChatRoomVisibilityType {
  PUBLIC = "PUBLIC",
  PRIVATE = 'PRIVATE',
  DIRECT_MESSAGE = "DIRECT_MESSAGE"
}

export const chatRoomTypeEnum = pgEnum("chat_room_type", ChatRoomVisibilityType);

export const chat_rooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  roomName: varchar("room_name", {length: 100}),
  visibilityType: chatRoomTypeEnum("type").default(ChatRoomVisibilityType.PRIVATE).notNull(),
  createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull()
})

export const chatRoomsSchema = {
  select: createSelectSchema(chat_rooms, {
    id: z.uuid(),
    roomName: (schema) => schema.trim(),
    visibilityType: z.enum(ChatRoomVisibilityType),
    createdAt: z.coerce.date()
  }),
  insert: createInsertSchema(chat_rooms)
}

