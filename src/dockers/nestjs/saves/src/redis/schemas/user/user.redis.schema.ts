import z from "zod";
import { userSchema } from "../../../drizzle/schema/users/users.schema.js";
import { userProfileSchema } from "../../../drizzle/schema/user_profiles/user_profiles.schema.js";

export const redisCacheUserSchema = z.object({
  ...userSchema.insert.shape,
  user_profile: z.object({
    ...userProfileSchema.insert.shape
  }).required().nullable()
}).required().strip();

export type RedisCacheUserDto = z.infer<typeof redisCacheUserSchema>;

