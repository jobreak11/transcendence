
import { pgEnum, pgTable, serial, text, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { Role } from "../../auth/enums/role.enum.js";
import { randomInt } from "node:crypto";
import { titles } from "./titles.schema.js";


export const roleEnum = pgEnum("role", Role);

export enum PronounType {
  HE_HIM = "he/him",
  SHE_HER = "she/her",
  THEY_THEM = "they/them",
  PREFER_NOT_TO_SAY = "prefer not to say"
}

export const pronounTypeEnum = pgEnum("user_pronoun", PronounType);

export enum PokerCardTheme {
  STANDARD = "STANDARD",
  FANTASY = "FANTASY"
}

export const pokerCardThemeEnum = pgEnum('user_poker_card_theme', PokerCardTheme);

const generateTagId = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random4 = String(randomInt(0, 10000)).padStart(4, "0");

  return `${yy}${mm}${dd}_${random4}`;
};


export const users = pgTable("users", {
	id:uuid("id").primaryKey().$defaultFn(() => uuidv7()),

  tagId: varchar("tag_id", {length: 11}).unique().notNull().$defaultFn(() => generateTagId()),

	email:varchar("email", {length: 90}).unique().notNull(),

	password:text("password").notNull(),

	role:roleEnum("role").default(Role.USER).notNull(),

	hashedRefreshToken:text("hashed_refresh_token"),

	displayName:varchar("display_name", {length: 100}),

	avatarUrl: varchar("avatar_url", {length: 200}),

	createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),

  pronoun: pronounTypeEnum("pronoun"),

  signature: varchar("signature", {length: 100}),

  activeTitleId: uuid("active_title_id").references(() => titles.id, 
  {onDelete: "set null"}),

  cardTheme: pokerCardThemeEnum("card_theme").notNull().default(PokerCardTheme.STANDARD),
})
