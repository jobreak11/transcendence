
import { eq } from "drizzle-orm";
import { db } from "../db.js"
import { titles } from "../schema/titles.schema.js"

async function insert_titles(titlesInfo: {
    name: string,
    description?: string
}[]) {

    await db.insert(titles)
        .values( titlesInfo )
        .onConflictDoNothing();
}

export async function seeding_titles(): Promise<string | null> {

    console.log("seeding title database");

    await insert_titles([

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

    const [foundDefaultTitle] = await db.select()
      .from(titles)
      .where(eq(titles.name, "Poker Rookie"))
      .limit(1)

    console.log("seeding title database successfully");

    if (!foundDefaultTitle) {
        return null;
    }
    return foundDefaultTitle.id
}