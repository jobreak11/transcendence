import { check, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { title } from "process";
import { v7 as uuidv7 } from "uuid"
import { asc, desc, sql } from "drizzle-orm";
import { titles } from "../titles.schema.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";
import { trophies } from "../throphies/trophies.schema.js";

export const achievements = pgTable("achievements", {

    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),

    name: varchar("name", { length: 200 }).notNull(),

    description: text("description"),

    condition: text("condition"),

    titleId: uuid("title_id").references(() => titles.id, { onDelete: "set null"}),

    trophyId: uuid("trophy_id").references(() => trophies.id, { onDelete: "set null"}),

    createdAt: timestamp("created_at", { withTimezone: true}).defaultNow().notNull()
}, (t) => [
    index("achievements_created_by_name_idx").on(desc(t.createdAt), asc(t.name)),
    index("achievements_name_idx").on(asc(t.name))
])

const selectSchema = createSelectSchema(achievements)

export const achievementsDatabaseSchema = {
    select: selectSchema,
    insert: createInsertSchema(achievements)
}

type test = z.infer<typeof achievementsDatabaseSchema.select>