import z from "zod";
import { userAchievementsDatabaseSchema } from "./user_achievements.schema.js";
import { ApiProperty } from "@nestjs/swagger";
import { v7 as uuidv7 } from "uuid"

type test = z.infer<typeof userAchievementsDatabaseSchema.select>;

export class UserAchievementDto implements test {

    @ApiProperty({
        example: uuidv7(),
        description: "the uuid of user that have this achievement"
    })
    userId: string;

    @ApiProperty({
        example: uuidv7(),
        description: "this uuid of the achievement this user got"

    })
    achievementId: string;

    @ApiProperty({
        example: (new Date()).toISOString(),
        description: "the date when this user got the achievement"
    })
    unlockedAt: Date;
}