import { syncBuiltinESMExports } from "module";
import { db, seedPool } from "./db.js";
import { user_profiles } from "./schema/user_profiles/user_profiles.schema.js";
import { users } from "./schema/users/users.schema.js";
import * as argon2 from 'argon2'
import { titles } from "./schema/titles.schema.js";
import { Role } from "../../modules/auth/enums/role.enum.js";
import { seeding_titles } from "./seeding-helper/seeding-titles.js";
import { seeding_users } from "./seeding-helper/seeding-users.js";


async function seed() {
  console.log('seeding database...');


  // seeding database
  const defaultTitleId = await seeding_titles();

  await seeding_users(defaultTitleId)


  console.log("database seeded successfully");
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
