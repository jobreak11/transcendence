import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid"

export const throphies = pgTable("throphies", {

    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),

    name: varchar("name", { length: 100 }).notNull(),

    description: text("description"),

    imageUrl: varchar("image_url").notNull(),

    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow()
})
