import { boolean, integer, pgEnum, pgTable, primaryKey, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import { users } from "../users/users.schema.js";
import { game_matches } from "../game_matches/game_matches.schema.js";

export enum TournamentStatus {
  OPEN = "OPEN",
  SEEDING = "SEEDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TournamentRoundStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum TournamentGroupStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export const tournamentStatusEnum = pgEnum("tournament_status", TournamentStatus);
export const tournamentRoundStatusEnum = pgEnum("tournament_round_status", TournamentRoundStatus);
export const tournamentGroupStatusEnum = pgEnum("tournament_group_status", TournamentGroupStatus);

export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 100 }).notNull(),
  hostUserId: uuid("host_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  registrationEndsAt: timestamp("registration_ends_at", { withTimezone: true }).notNull(),
  maxParticipants: integer("max_participants"),
  status: tournamentStatusEnum("status").notNull().default(TournamentStatus.OPEN),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const tournamentParticipants = pgTable("tournament_participants", {
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
  finalPlace: integer("final_place"),
}, (table) => [
  primaryKey({ columns: [table.tournamentId, table.userId] }),
]);

export const tournamentRounds = pgTable("tournament_rounds", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  status: tournamentRoundStatusEnum("status").notNull().default(TournamentRoundStatus.IN_PROGRESS),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  unique("tournament_round_number_unique").on(table.tournamentId, table.roundNumber),
]);

export const tournamentGroups = pgTable("tournament_groups", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  roundId: uuid("round_id").notNull().references(() => tournamentRounds.id, { onDelete: "cascade" }),
  groupNumber: integer("group_number").notNull(),
  lobbyPinId: varchar("lobby_pin_id", { length: 6 }).notNull().unique(),
  gameMatchId: uuid("game_match_id").references(() => game_matches.id, { onDelete: "set null" }),
  status: tournamentGroupStatusEnum("status").notNull().default(TournamentGroupStatus.IN_PROGRESS),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  unique("tournament_group_number_unique").on(table.roundId, table.groupNumber),
]);

export const tournamentGroupPlayers = pgTable("tournament_group_players", {
  groupId: uuid("group_id").notNull().references(() => tournamentGroups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  place: integer("place"),
  qualified: boolean("qualified").notNull().default(false),
}, (table) => [
  primaryKey({ columns: [table.groupId, table.userId] }),
]);
