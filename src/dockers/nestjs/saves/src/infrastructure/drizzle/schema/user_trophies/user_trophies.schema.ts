import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../users/users.schema.js";
import { trophies } from "../throphies/trophies.schema.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";

export const user_trophies = pgTable("user_trophies", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade"}),
    trophyId: uuid("trophy_id").notNull().references(() => trophies.id, { onDelete: "cascade"}),
    unlockedAt: timestamp("unlocked_at", {withTimezone: true}).notNull().defaultNow()
}, (t) => [
    primaryKey({columns: [t.userId, t.trophyId]}),
    index("user_throphies_throphy_idx").on(t.trophyId)
])

const selectSchema = createSelectSchema(user_trophies);
const insertSchema = createInsertSchema(user_trophies)

export const userTrophiesDatabaseSchema = {
    select: selectSchema,
    insert: insertSchema
}

