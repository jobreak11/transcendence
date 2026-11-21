import { syncBuiltinESMExports } from "module";
import { Role } from "../auth/enums/role.enum.js";
import { db, seedPool } from "./db.js";
import { user_profiles } from "./schema/user_profiles/user_profiles.schema.js";
import { users } from "./schema/users/users.schema.js";
import * as argon2 from 'argon2'
import { titles } from "./schema/titles.schema.js";


async function seed() {
  console.log('seeding database...');

  const [res] = await db
    .insert(users)
    .values({
      email: process.env.TRANSCENDENCE_ADMIN_USER_EMAIL ?? "",
      password: await argon2.hash(process.env.TRANSCENDENCE_ADMIN_PASSWORD ?? ""),
      role: Role.ADMIN
    })
    .returning()
    .onConflictDoNothing()

  if (res) {
    await db
      .insert(user_profiles)
      .values({
        userId: res.id,
        displayName: "ADMIN",
      })
      .onConflictDoNothing()
  }

  console.log("database seeded successfully");

  console.log("seeding title database");

  await Promise.all([
    db.insert(titles)
      .values({
        name: "newbie",
        description: ""
      })
      .onConflictDoNothing()
  ])
}

seed()
  .catch((error) => {
    console.error("seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // close your database pool here if your db setup expose one
    await seedPool.end();
  })
