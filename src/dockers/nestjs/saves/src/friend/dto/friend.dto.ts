import { friendships } from "../../drizzle/schema/friendships.schema.js";

export type FriendshipsDto = typeof friendships.$inferSelect;