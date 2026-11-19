import z from "zod";
import { gameMatchesDatabaseSchema, GameType } from "./game_matches.schema.js";
import { GameSettingFormat } from "../../../../modules/lobby/redis/schemas/lobby-gameSettings.redis.schema.js";
import { ApiProperty } from "@nestjs/swagger";
import { LobbyGameSettingsDto } from "../../../../modules/lobby/redis/dtos/lobby-gameSettings.dto.js";

type test = z.infer<typeof gameMatchesDatabaseSchema.select>;

export class GameMatchDto implements test {

    @ApiProperty({
        description: "the id of this game matches"
    })
    id: string;

    @ApiProperty({
        description: "the game type of this game match",
        example: GameType.CASUAL,
        enum: GameType
    })
    gameType: GameType;

    @ApiProperty({
        description: "the total hands of all players in this match"
    })
    totalHandsPlayed: number;

    @ApiProperty({
        description: "the format of the game setting",
        enum: GameSettingFormat,
        example: GameSettingFormat.BEGINNER
    })
    gameFormat: GameSettingFormat;

    @ApiProperty({
        description: "the starting chips of this game matches",
        example: 2000
    })
    startingChips: number;

    @ApiProperty({
        description: "the bigblind amount"

    })
    bigBlind: number;

    @ApiProperty({
        description: "the ante amount"

    })
    ante: number;

    @ApiProperty({
        description: "the amount of player that played in this match"

    })
    totalPlayer: number;

    @ApiProperty({
        description: "the userId that created this room"

    })
    createdByUserId: string | null;

    @ApiProperty({
        description: "the timestamp when the match was started"
    })
    startedAt: Date;

    @ApiProperty({
        description: "the timestamp when the match was ended"

    })
    endedAt: Date;
}