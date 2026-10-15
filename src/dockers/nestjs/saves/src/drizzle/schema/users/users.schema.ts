
import { pgEnum, pgTable, serial, text, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { defineRelations, sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { Role } from "../../../auth/enums/role.enum.js";
import { randomInt } from "node:crypto";
import { titles } from "../titles.schema.js";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod"
import z from "zod";

export const roleEnum = pgEnum("user_role", Role);

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

	//role:roleEnum("role").default(Role.USER).notNull(),
	role:roleEnum("role").default(Role.USER).notNull(),

	hashedRefreshToken:text("hashed_refresh_token"),

	//displayName:varchar("display_name", {length: 100}),

	//avatarUrl: varchar("avatar_url", {length: 500}),

	createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),

  //pronoun: pronounTypeEnum("pronoun"),

  //signature: varchar("signature", {length: 100}),

  //activeTitleId: uuid("active_title_id").references(() => titles.id, 
  //{onDelete: "set null"}),

  //cardTheme: pokerCardThemeEnum("card_theme").notNull().default(PokerCardTheme.STANDARD),
})

const insertUserSchema = createInsertSchema(users, {
  email: z.email(),
  password: (schema) => schema.min(8),
  //displayName: (schema) => schema.min(1).nullish(),
  //avatarUrl: z.url().max(500).nullish(),
  role: z.enum(Role).default(Role.USER),
  createdAt: z.coerce.date().optional()
}).strict();

export const userSchema = {
  select: createSelectSchema(users).strict(),
  insert: insertUserSchema,
  update: insertUserSchema.partial().strict()
}

type test = z.infer<typeof userSchema.insert>
