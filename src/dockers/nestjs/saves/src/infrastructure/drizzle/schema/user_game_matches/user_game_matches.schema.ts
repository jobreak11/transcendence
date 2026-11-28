import { check, index, integer, pgTable, primaryKey, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { game_matches } from "../game_matches/game_matches.schema.js";
import { users } from "../users/users.schema.js";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";

export const user_game_matches = pgTable("user_game_matches", {

  gameMatchId: uuid("game_match_id").notNull().references(() => game_matches.id, {onDelete: "cascade"}),
  userId: uuid("user_id").notNull().references(() => users.id, {onDelete: "cascade"}),

  playerPlace: integer("player_place").notNull(),

  playCount: integer("play_count").notNull(),

  winCount: integer("win_count").notNull(),

  rankEarned: integer("rank_earned").notNull(),
  expEarned: integer("exp_earned").notNull(),

}, (t) => [
  check("player_place_check", sql`${t.playerPlace} BETWEEN 1 AND 10`),
  check("exp_earned_check", sql`${t.expEarned} >= 0`),
  unique("unique_player_place_per_game").on(t.gameMatchId, t.playerPlace),
  primaryKey({columns: [t.userId, t.gameMatchId]}),
  index("user_game_matches_game_match_idx").on(t.gameMatchId)
])

const selectSchema = createSelectSchema(user_game_matches);
const insertSchema = createInsertSchema(user_game_matches);

export const userGameMatchesDatabaseSchema = {
  select: selectSchema,
  insert: insertSchema
}
