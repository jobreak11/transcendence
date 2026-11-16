import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../users/users.schema.js";
import { achievements } from "../achievements/achievements.schema.js";
import { desc } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

export const user_achievements = pgTable("user_achievements", {
    userId: uuid("user_id").notNull().references(() => users.id, {onDelete: "cascade"}),
    achievementId: uuid("achievement_id").notNull().references(() => achievements.id, {onDelete: "cascade"}),
    unlockedAt: timestamp("unlocked_at", {withTimezone: true}).notNull().defaultNow()
}, (t) => [
    primaryKey({columns: [t.userId, t.achievementId]}),
    index("user_achievements_achievement_idx").on(t.achievementId),
    index("user_achievements_unlocked_at_idx").on(t.userId, desc(t.unlockedAt))
])

const selectSchema = createSelectSchema(user_achievements, {
    userId: z.uuid(),
    achievementId: z.uuid(),
    unlockedAt: z.coerce.date()
})

export const userAchievementsDatabaseSchema = {
    select: selectSchema,
    insert: createInsertSchema(user_achievements)
}
