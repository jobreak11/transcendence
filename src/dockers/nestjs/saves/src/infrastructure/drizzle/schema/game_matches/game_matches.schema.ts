import { integer, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from 'uuid'
import { users } from "../users/users.schema.js";
import { GameSettingFormat } from "../../../../modules/lobby/redis/schemas/lobby-gameSettings.redis.schema.js";

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


export enum GameType {
  CASUAL = "CASUAL",
  RANKED = "RANKED",
  TOURNAMENT = "TOURNAMENT",
}

export const gameTypeEnum = pgEnum("game_matches_game_type", GameType);

export const gameFormatEnum = pgEnum("game_matche_game_format", GameSettingFormat);

export const game_matches = pgTable("game_matches", {

  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),

  // game type => CAUSAL RANK TOURNAMENT
  gameType: gameTypeEnum("game_type").notNull(),

  totalHandsPlayed: integer("total_hands_played").notNull(),

  // game settings like bligblind stack ante
  gameFormat: gameFormatEnum("game_format").notNull(),
  startingChips: integer("starting_chips").notNull(),
  bigBlind: integer("big_blind").notNull(),
  ante: integer("ante").notNull(),
  totalPlayer: integer("total_player").notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, {onDelete: "set null"}),
  startedAt: timestamp("started_at", {withTimezone: true}).notNull(),
  EndedAt: timestamp("ended_at", {withTimezone: true}).notNull(),

})
