import { Role } from "../../../modules/auth/enums/role.enum.js"
import { db } from "../db.js"
import * as argon2 from "argon2"
import { users } from "../schema/users/users.schema.js"
import { user_profiles } from "../schema/user_profiles/user_profiles.schema.js"
import { UserDto } from "../schema/users/user.dto.js"
import { user_titles } from "../schema/user_titles.schema.js"
import { eq, inArray, sql } from "drizzle-orm"
import { titles } from "../schema/titles.schema.js"

async function insert_users(usersInfo: {
    email: string,
    password: string,
    role: Role,
    displayedName?: string
}[], defaultTitleId: string | null) {

    if (usersInfo.length === 0) {
        return ;
    }

    const converted = await Promise.all(usersInfo.map(async (user) => {

        const hashed = await argon2.hash(user.password);

        return {
            email: user.email,
            password: hashed,
            role: user.role
        }
    }));


    const result = await db.insert(users)
        .values(converted)
        .onConflictDoUpdate({
            target: users.email,
            set: {
                password: sql`excluded.password`
            }
        })
        .returning();

    if (result.length === 0) {
        return ;
    }

    const resultCoupled = result.map((value) => {

        const found = usersInfo.find((user) => user.email === value.email);

        if (!found) {
            throw Error("cannot find email from input, or put same email to multiple account")
        }

        return {
            userId: value.id,
            displayName: found.displayedName
        }
    })
    // create user profile 

    const userProfiles = await db.insert(user_profiles)
        .values(
            resultCoupled
        )
        .onConflictDoNothing()
        .returning()

    if (defaultTitleId) {
       const [foundTitle] = await db.select().from(titles).where(eq(titles.id, defaultTitleId)).limit(1);

        if (foundTitle) {

            const insertUsersTitles = resultCoupled.map((value) => {
                return {
                    userId: value.userId,
                    titleId: defaultTitleId
                }
            })

            await db.insert(user_titles)
                .values(insertUsersTitles)
                .onConflictDoNothing()

            await db.update(user_profiles)
                .set({activeTitleId: defaultTitleId})
                .where(inArray(user_profiles.userId, insertUsersTitles.map((value) => value.userId)))
                .catch(() => {})

        }
    }

}

async function insert_admin() {

    const email = process.env.TRANSCENDENCE_ADMIN_USER_EMAIL ?? "";
    const password = process.env.TRANSCENDENCE_ADMIN_PASSWORD ?? "";
    const role = Role.ADMIN;
    const displayedName = "ADMIN" ;

    const hashed = await argon2.hash(password);

    await db.insert(users)
        .values({
            email: email,
            password: hashed,
            role: role,
        })
        .onConflictDoUpdate({
            target: users.email,
            set: {
                password: hashed
            }
        });


    
}

export async function seeding_users(defaultTitleId: string | null) {

    console.log("seeding user database");

    await insert_users([
        {
            email: process.env.TRANSCENDENCE_ADMIN_USER_EMAIL ?? "",
            password: process.env.TRANSCENDENCE_ADMIN_PASSWORD ?? "",
            role: Role.ADMIN,
            displayedName: "ADMIN"
        }
    ], defaultTitleId);

    console.log("seeding user database successful");
}