import z from "zod";
import { userGameMatchesDatabaseSchema } from "./user_game_matches.schema.js";
import { ApiProperty } from "@nestjs/swagger";

type test = z.infer<typeof userGameMatchesDatabaseSchema.select>

export class UserGameMatchDto {

    @ApiProperty({
        description: "the game match id"

    })
    gameMatchId: string;

    @ApiProperty({
        description: "the user id"

    })
    userId: string;

    @ApiProperty({
        description: "the place for this player for this match"

    })
    playerPlace: number;

    @ApiProperty({
        description: "describe how many hands this user was played."

    })
    playCount: number;

    @ApiProperty({
        description: "total win count of this match"

    })
    winCount: number;

    @ApiProperty({
        description: "the rank that earned from this match"

    })
    rankEarned: number;

    @ApiProperty({
        description: "the exp that earn from this match"

    })
    expEarned: number;
}