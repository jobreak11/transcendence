import { syncBuiltinESMExports } from "module";
import { db, seedPool } from "./db.js";
import { user_profiles } from "./schema/user_profiles/user_profiles.schema.js";
import { users } from "./schema/users/users.schema.js";
import * as argon2 from 'argon2'
import { titles } from "./schema/titles.schema.js";
import { Role } from "../../modules/auth/enums/role.enum.js";


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

  await db.insert(titles)
    .values([

      // DEFAULT
      {
        name: "Poker Rookie",
        description: ""
      },


      // ADMIN / DEV
      {
        name: "DaveChips 888",
        description: ""
      },
      {
        name: "Dont@Me",
        description: ""
      },

      // ACHIEVEMENTS
      {
        name: "All or Nothing",
        description: "ได้จากทุ่ม All-in แล้วหมดตัว โหมดใดก็ได้"
      },
      {
        name: "It's over 9000",
        description: "ได้จากจบเกมโดยถือชิพอยู่ 9000 หรือมากกว่า โหมดใดก็ได้"
      },
      {
        name: "Cat Despair",
        description: "ได้จากการ fold หรือเสียชิพติดต่อกัน 8 hand โหมดใดก็ได้"
      },
      {
        name: "Lady Luck",
        description: "ได้จากการได้ชิพติดต่อกัน 8 hand โหมดใดก็ได้"
      },
      {
        name: "Sleight of Hand",
        description: "ได้จากการชนะ hand ด้วยไพ่ 1 pair บนมือ โหมดใดก็ได้"
      },
      {
        name: "Thug Life",
        description: "ได้จากการชนะเกมหรือติด top 4 ด้วยการชนะเพียง 1 hand โหมดใดก็ได้"
      },
      {
        name: "Jackpot 888",
        description: "ได้จากการชนะ hand ด้วย royal flush โหมดใดก็ได้"
      },
      {
        name: "The First Take",
        description: "ได้จากการเล่น ranked ครั้งแรก จนจบเกม ไม่นับตาที่ disconnec"
      },
      {
        name: "Dies of Cringe",
        description: "ได้จากการ fold ทุก hand ตลอดเกมในโหมด ranked"
      },
      {
        name: "High-class Chips",
        description: "ได้จากการถึง rank master เป็นครั้งแรก"
      },
      {
        name: "First-class Poker",
        description: "ได้จากการถึง rank transcended เป็นครั้งแรก"
      },
      {
        name: "Super Idol 888",
        description: "ได้จากการชนะ hand ด้วย royal flush ในโหมด ranked ห้องผู้เล่นระดับ transcended"
      },

      // Tournament ( 42 Open 2026 )
      {
        name: "42 Trailblazer 2026",
        description: "ได้จากการเข้าร่วม 42 Open 2026"
      },
      {
        name: "42 Finalist 2026",
        description: "ได้จากการเข้ารอบ 8 คนสุดท้ายใน 42 Open 2026"
      },
      {
        name: "42 Poker Awards 2026",
        description: "ได้จากการชนะอันดับ 1 ใน 42 Open 2026"
      },

      // EXTRA SECRET
      {
        name: "Inw Poker since 1942",
        description: "แจกให้เฉพาะคนที่ตรวจ transcendence กลุ่มเรา"
      },

    ])
    .onConflictDoNothing()
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
