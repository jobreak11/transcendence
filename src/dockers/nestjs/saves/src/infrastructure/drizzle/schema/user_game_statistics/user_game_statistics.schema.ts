import { index, integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { users } from "../users/users.schema.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";

export const user_game_statistics = pgTable("user_game_statistics", {
  userId: uuid("user_id").primaryKey().references(() => users.id, {onDelete: "cascade"}),

  expPoint: integer("exp_point").notNull().default(0),
  level: integer("level").notNull().default(0),

  rankPoint: integer("rank_point").notNull().default(0),

  matchPlayed: integer("match_played").notNull().default(0),

  totalMatchesWon: integer("total_matches_won").notNull().default(0),

  totalHandsPlayed: integer("total_hands_played").notNull().default(0),

  totalHandsWon: integer("total_hands_won").notNull().default(0)
})

const selectSchema = createSelectSchema(user_game_statistics);
const insertSchema = createInsertSchema(user_game_statistics);

export const userGameStatisticsDatabaseSchema = {
  select: selectSchema,
  insert: insertSchema,
}

