import z from "zod";
import { userTrophiesDatabaseSchema } from "./user_trophies.schema.js";
import { ApiProperty } from "@nestjs/swagger";
import { v7 as uuidv7 } from 'uuid'

type test = z.infer<typeof userTrophiesDatabaseSchema.select>;

export class UserTrophyDto implements test {

    @ApiProperty({
        description: "the uuid of the user that got this trophy",
        example: uuidv7()
    })
    userId: string;

    @ApiProperty({
        description: "the uuid of the trophy",
        example: uuidv7()
    })
    trophyId: string;

    @ApiProperty({
        description: "the date this trophy unlocked to this user",
        example: (new Date()).toISOString()
    })
    unlockedAt: Date;
}