import z from "zod";
import { achievementsDatabaseSchema } from "./achievements.schema.js";
import { ApiProperty } from "@nestjs/swagger";
import { v7 as uuidv7 } from "uuid"


type test = z.infer<typeof achievementsDatabaseSchema.select>

export class AchievementDto implements test {
    
    @ApiProperty({
        example: uuidv7(),
        description: "the uuid"
    })
    id: string; 

    @ApiProperty({
        example: "Get High",
        description: "the name of the achievement"
    })
    name: string;    

    @ApiProperty({

        example: "Am i High?",
        description: "the description of the achivement."

    })
    description: string | null; 

    @ApiProperty({
        example: "won by high cards 100 times",
        description: "the condition for this achievement to triggered"
    })
    condition: string | null;    

    @ApiProperty({
        example: uuidv7(),
        description: "title uuid linked to this achievement."
    })
    titleId: string | null; 

    @ApiProperty({
        example: uuidv7(),
        description: "throphy uuid linked to this achievement"
    })
    throphyId: string | null;    

    @ApiProperty({
        example: (new Date()).toISOString(),
        description: "the time this achivement was created"
    })
    createdAt: Date;

}