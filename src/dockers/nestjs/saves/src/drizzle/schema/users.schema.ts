
import { pgEnum, pgTable, serial, text, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { Role } from "../../auth/enums/role.enum.js";
import { randomInt } from "node:crypto";


export const roleEnum = pgEnum("role", Role);

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
	createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull()
})