import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { titles } from "./titles.schema.js";
import { users } from "./users.schema.js";


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

