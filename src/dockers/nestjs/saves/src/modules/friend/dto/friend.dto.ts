import { friendships } from "../../../infrastructure/drizzle/schema/friendships.schema.js";

export type FriendshipsDto = typeof friendships.$inferSelect;