import { index, integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { users } from "../users/users.schema.js";
import { game_matches } from "../game_matches/game_matches.schema.js";

export interface MatchProgress {
  cycleNumber: number;
  handNumber: number;
  cyclePlayerIds: string[];
  bigBlindPlayerIds: string[];
  cycleComplete: boolean;
  matchPlayerIds: string[];
  playerPlaces: Record<string, number>;
  matchComplete: boolean;
  totalHandsPlayed: number;
  startedAt: string | null;
}

export interface EventGameFinishStateToClientDto {
  settled: boolean;
  handId: string;
  tableSessionId: string;
  matchId: string;
  cycleNumber: number;
  handNumber: number;
  round: string;
  roundNumber: number;
  cycleComplete: boolean;
  matchComplete: boolean;
  playerPlaces: Record<string, number>;
  playerNames?: Record<string, string>;
  totalHandsPlayed: number;
  matchStartedAt: string;
  matchEndedAt?: string;
  poolCards: string[];
  pot: number;
  ante: number;
  winners: {
    playerId: string,
    amount: number,
    hand: string | undefined
  }[];
  revealedCards: {
    [k: string]: string[];
  } | undefined;
  players: {
    playerId: string;
    stack: number;
    folded: boolean;
    allIn: boolean;
  }[];
}

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