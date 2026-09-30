import { users } from "../../drizzle/schema/users.schema.js";

export type UserDto = typeof users.$inferSelect;