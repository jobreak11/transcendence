import z from "zod";
import { trophiesDatabaseSchema } from "./trophies.schema.js";
import { ApiProperty } from "@nestjs/swagger";
import { v7 as uuidv7 } from 'uuid'

type test = z.infer<typeof trophiesDatabaseSchema.select>;

export class TrophyDto {
    
    @ApiProperty({
        description: "the id of the trophy",
        example: uuidv7()
    })
    id: string;

    @ApiProperty({
        description: "name of the trophy",
        example: "champion trophy"
    })
    name: string;

    @ApiProperty({
        description: "the description detail of the trophy"
    })
    description: string | null;

    @ApiProperty({
        description: "the image url of the trophy"
    })
    imageUrl: string | null;

    @ApiProperty({
        description: "the date this trophy was created"

    })
    createdAt: Date;
}