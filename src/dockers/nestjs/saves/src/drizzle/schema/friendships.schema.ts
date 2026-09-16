import { check, pgEnum, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";
import { sql } from "drizzle-orm";

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  BLOCKED = 'BLOCKED'
}

export const friendshipStausEnum = pgEnum("friendship_status", FriendshipStatus);

export const friendships = pgTable(
  "friendships",
  {
    requesterUserId: uuid('requester_user_id')
      .notNull()
      .references(() => users.id, {onDelete: "cascade"} ),
    
    addresseeUserId: uuid('addressee_user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),

    status: friendshipStausEnum('status').default(FriendshipStatus.PENDING).notNull(),
    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),

  },
  (t) => [
    primaryKey({ columns: [t.requesterUserId, t.addresseeUserId]}),
    check("no_self_relationship", sql`${t.requesterUserId} != ${t.addresseeUserId}`),
  ]
)