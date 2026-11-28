import z from "zod"
import { userGameStatisticsDatabaseSchema } from "./user_game_statistics.schema.js"
import { ApiProperty } from "@nestjs/swagger";

type test = z.infer<typeof userGameStatisticsDatabaseSchema.select>;

export class UserGameStatisticDto implements test {

    @ApiProperty({
        description: "the id of the user"
    })
    userId: string;

    @ApiProperty({
        description: "the exp point of that user left after deducting from level"
    })
    expPoint: number;

    @ApiProperty({
        description: "the level of the user"

    })
    level: number;

    @ApiProperty({
        description: "the total rank of the user"

    })
    rankPoint: number;

    @ApiProperty({
        description: "the total matches that this user has played"
    })
    matchPlayed: number;

    @ApiProperty({
        description: "the total matches that user has won."
    })
    totalMatchesWon: number;

    @ApiProperty({
        description: "the total hands that user has played from all the game matches"
    })
    totalHandsPlayed: number;

    @ApiProperty({
        description: "the total hands that user has played and won from all the game matches"
    })
    totalHandsWon: number;
}