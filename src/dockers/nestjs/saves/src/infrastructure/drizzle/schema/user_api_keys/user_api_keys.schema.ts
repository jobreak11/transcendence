import { boolean, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from 'uuid'
import { users } from "../users/users.schema.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { desc } from "drizzle-orm";

export const user_api_keys = pgTable('user_api_keys', {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade'}),
    keyName: varchar('key_name', { length: 100 }).notNull(),
    keyPrefix: varchar('key_prefix', {length: 200}).notNull(),
    keyHashed: varchar('key_hashed', {length: 200}).notNull().unique(),
    isRevoked: boolean('is_revoked').notNull().default(false),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow()
}, (t) => [
    index("user_api_keys_created_at_idx").on(desc(t.createdAt), t.keyName)
])

const selectSchema = createSelectSchema(user_api_keys);
const insertSchema = createInsertSchema(user_api_keys);

export const userApiKeysDatabaseSchema = {
    select: selectSchema,
    insert: insertSchema
}
