
import { pgEnum, pgTable, serial, text, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { Role } from "../../auth/enums/role.enum.js";


export const roleEnum = pgEnum("role", Role);

export const users = pgTable("users", {
	id:uuid("id").primaryKey().$defaultFn(() => uuidv7()),
	email:varchar("email", {length: 90}).unique().notNull(),
	password:text("password").notNull(),
	role:roleEnum("role").default(Role.USER).notNull(),
	hashedRefreshToken:text("hashedRefreshToken"),
	displayName:varchar("displayName", {length: 100}),
	avatarUrl: varchar("avatarUrl", {length: 200}),
	createdAt: timestamp("createdAt", {withTimezone: true}).defaultNow().notNull()
})