import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { v7 as uuidv7 } from "uuid"
import z from "zod";

export const trophies = pgTable("trophies", {

    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),

    name: varchar("name", { length: 100 }).notNull(),

    description: text("description"),

    imageUrl: varchar("image_url"),

    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow()
})

const selectSchema = createSelectSchema(trophies, {
    imageUrl: z.url().nullable()
});
const insertSchema = createInsertSchema(trophies, {
    imageUrl: z.url().nullish(),
    createdAt: z.coerce.date().optional()
});

type test = z.input<typeof insertSchema>;

export const trophiesDatabaseSchema = {
    select: selectSchema,
    insert: insertSchema
}


