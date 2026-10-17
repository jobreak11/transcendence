import { pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { titles } from "../titles.schema.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { users } from "../users/users.schema.js";

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

export const user_profiles = pgTable("user_profiles", {

  userId: uuid("user_id").primaryKey().references(() => users.id, {onDelete: "cascade"}),

	displayName:varchar("display_name", {length: 100}),

	avatarUrl: varchar("avatar_url", {length: 500}),

  pronoun: pronounTypeEnum("pronoun"),

  signature: varchar("signature", {length: 100}),

  activeTitleId: uuid("active_title_id").references(() => titles.id, 
  {onDelete: "set null"}),

  cardTheme: pokerCardThemeEnum("card_theme").notNull().default(PokerCardTheme.STANDARD),
});

const insertUserProfileSchema = createInsertSchema(user_profiles, {
  displayName: (schema) => schema.min(1).nullish(),
  avatarUrl: z.url().max(500).nullish(),
  pronoun: z.enum(PronounType).nullish(),
  cardTheme: z.enum(PokerCardTheme).default(PokerCardTheme.STANDARD).optional()
}).strict()

export const userProfileSchema = {
  select: createSelectSchema(user_profiles).strict(),
  insert: insertUserProfileSchema,
  update: insertUserProfileSchema.partial().strict()
}

type test = z.infer<typeof userProfileSchema.insert>;

