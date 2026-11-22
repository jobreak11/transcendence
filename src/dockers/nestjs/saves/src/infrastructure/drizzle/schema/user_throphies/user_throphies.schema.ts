import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../users/users.schema.js";
import { throphies } from "../throphies/throphies.schema.js";

export const user_throphies = pgTable("user_throphies", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade"}),
    throphy_id: uuid("throphy_id").notNull().references(() => throphies.id, { onDelete: "cascade"}),
    unlockedAt: timestamp("unlocked_at", {withTimezone: true}).notNull().defaultNow()
}, (t) => [
    primaryKey({columns: [t.userId, t.throphy_id]}),
    index("user_throphies_throphy_idx").on(t.throphy_id)
])

