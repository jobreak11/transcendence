import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from 'uuid'

/* The */
export const titles = pgTable("titles", 
  {

    // Primary key
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),

    // Name of the title, must not be empty
    name: varchar("name", {length: 100}).notNull().unique(),

    // The description of the title
    // may be you can describe here on how or where
    // this title came from or what it means
    description: text("description"),

    // The time this title were added
    // maybe useful if we want to see when this or that title
    // comes
    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull()
  },
  (t) => [
    index("title_name_created_at_idx").on(t.name, t.createdAt.desc())
  ]
);

