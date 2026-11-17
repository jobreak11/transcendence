import { forwardRef, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { DRIZZLE } from "../../../infrastructure/drizzle/drizzle.module.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema } from "../../../infrastructure/drizzle/schema/schema.js";
import { game_matches, GameType } from "../../../infrastructure/drizzle/schema/game_matches/game_matches.schema.js";
import { MatchProgress } from "../../../api/websocket/game-gateway/dtos/match-progress.dto.js";
import { LobbyService } from "../../lobby/lobby.service.js";
import { LobbyRoomType } from "../../lobby/redis/schemas/lobby-generalSettings.redis.schema.js";
import { logError } from "../../../utility/logError.js";
import { user_game_matches } from "../../../infrastructure/drizzle/schema/user_game_matches/user_game_matches.schema.js";
import { user_game_statistics } from "../../../infrastructure/drizzle/schema/user_game_statistics/user_game_statistics.schema.js";
import { sql } from "drizzle-orm";
import { type WrapperType } from "../../../types/wrapperType.js";

@Injectable()
export class GameDatabaseService {

    private readonly logger = new Logger(GameDatabaseService.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbSchema.dbRelations>,
        @Inject(forwardRef(() => LobbyService))private readonly lobbyService: WrapperType<LobbyService>,
        
    ) {

    }

    async createNewGameMatches(matchProgress: MatchProgress, matchEndedTimestamp: Date, lobbyPinId: string) {

        const lobby = await this.lobbyService.getLobbyDto(lobbyPinId);

        const [newGameMatch] = await this.db.insert(game_matches)
            .values({
                ante: lobby.gameSettings.ante ?? 0,
                bigBlind: lobby.gameSettings.bigBlind,
                gameType: lobby.generalSettings.roomType === LobbyRoomType.RANKED ? GameType.RANKED : lobby.generalSettings.roomType === LobbyRoomType.TOURNAMENT ? GameType.TOURNAMENT : GameType.CASUAL,
                gameFormat: lobby.gameSettings.format,
                createdByUserId: lobby.details.createdByUserId,
                startingChips: lobby.gameSettings.startingChips,
                totalPlayer: Object.keys(matchProgress.playerPlaces).length,
                totalHandsPlayed: matchProgress.totalHandsPlayed,
                startedAt: matchProgress.startedAt ? new Date(matchProgress.startedAt) : new Date(),
                endedAt: matchEndedTimestamp
            })
            .returning();

        if (!newGameMatch) {
            throw logError(this.logger,
                "error from createNewGameMatches()",
                "database insert game match failed",
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }


        const insertUserGameMatchData = Object.entries(matchProgress.playerStats).map(([playerId, value]) => {
            const playerPlaceRaw = matchProgress.playerPlaces[playerId];
            if (!playerPlaceRaw) {
                throw logError(
                    this.logger,
                    "error from createdNewGameMatches",
                    "cannot find player place in matchProgess structure",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                userId: playerId,
                gameMatchId: newGameMatch.id,
                playerPlace: playerPlaceRaw,
                expEarned: value.expEarned,
                rankEarned: value.rankEarned,
                playCount: value.playCount,
                winCount: value.winCount,
            }
        })

        const insertUserGameMatchResult = await this.db.insert(user_game_matches)
            .values(insertUserGameMatchData)
            .returning()

        if (insertUserGameMatchResult.length === 0) {
            throw logError(
                this.logger,
                "error from createNewGameMatches",
                "insert user game matches failed",
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        // insert multiple user statistics using insert but onConflictUpdate

        const insertUserGameStatistics = insertUserGameMatchResult.map((value) => {

            return {
                userId: value.userId,
                expPoint: value.expEarned,
                rankPoint: value.rankEarned,
                totalHandsWon: value.winCount,
                totalHandsPlayed: value.playCount,
                totalMatchesWon: value.playerPlace > Object.keys(matchProgress.playerPlaces).length / 2 ? 1 : 0,
                matchPlayed: 1
            }
        })

        const insertGameStatsResult = await this.db.insert(user_game_statistics)
            .values(insertUserGameStatistics)
            .onConflictDoUpdate({
                target: user_game_statistics.userId,
                set: {
                    expPoint: sql`${user_game_statistics.expPoint} + excluded.exp_point`,
                    rankPoint: sql`${user_game_statistics.rankPoint} + excluded.rank_point`,
                    matchPlayed: sql`${user_game_statistics.matchPlayed} + excluded.match_played`,
                    level: sql`${user_game_statistics.level} + excluded.level`,
                    totalHandsPlayed: sql`${user_game_statistics.totalHandsPlayed} + excluded.total_hands_played`,
                    totalHandsWon: sql`${user_game_statistics.totalHandsWon} + excluded.total_hands_won`,
                    totalMatchesWon: sql`${user_game_statistics.totalMatchesWon} + excluded.total_matches_won`
                }
            })
            .returning();

        return newGameMatch; 
    }

}