import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { titles } from "./titles.schema.js";
import { users } from "./users/users.schema.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";


export const user_titles = pgTable("user_titles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),

    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, {onDelete: "cascade"}),

    unlockedAt: timestamp("unlocked_at", {withTimezone: true}).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({columns: [t.userId, t.titleId]}),
    index("user_title_user_idx").on(t.userId)
  ]
);

export const userTitleSchema = {
  select: createSelectSchema(user_titles),
  insert: createInsertSchema(user_titles)
}
