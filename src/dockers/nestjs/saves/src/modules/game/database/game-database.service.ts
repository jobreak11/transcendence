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
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { type WrapperType } from "../../../types/wrapperType.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";
import {
    TournamentGroupStatus,
    tournamentGroupPlayers,
    tournamentGroups,
    tournamentRounds,
} from "../../../infrastructure/drizzle/schema/tournaments/tournaments.schema.js";

@Injectable()
export class GameDatabaseService {

    private readonly logger = new Logger(GameDatabaseService.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbSchema.dbRelations>,
        @Inject(forwardRef(() => LobbyService))private readonly lobbyService: WrapperType<LobbyService>,
        
    ) {

    }

    async getGameMatches(userId: string, limit: number = 50, offset: number = 0) {

        const result = await this.db
            .select()
            .from(user_game_matches)
            .innerJoin(game_matches, eq(game_matches.id, user_game_matches.gameMatchId))
            .where(eq(user_game_matches.userId, userId))
            .orderBy(desc(game_matches.endedAt))
            .limit(limit)
            .offset(offset);

        return result;
    }

    async getTournamentMatchDetails(userId: string, gameMatchIds: string[]) {
        if (gameMatchIds.length === 0) return [];

        const matches = await this.db
            .select({
                gameMatchId: tournamentGroups.gameMatchId,
                roundId: tournamentRounds.id,
                roundNumber: tournamentRounds.roundNumber,
                groupStatus: tournamentGroups.status,
                qualified: tournamentGroupPlayers.qualified,
                playerPlace: tournamentGroupPlayers.place,
            })
            .from(tournamentGroups)
            .innerJoin(tournamentRounds, eq(tournamentRounds.id, tournamentGroups.roundId))
            .innerJoin(
                tournamentGroupPlayers,
                and(
                    eq(tournamentGroupPlayers.groupId, tournamentGroups.id),
                    eq(tournamentGroupPlayers.userId, userId),
                ),
            )
            .where(inArray(tournamentGroups.gameMatchId, gameMatchIds));
        if (matches.length === 0) return [];

        const groupCounts = await this.db
            .select({
                roundId: tournamentGroups.roundId,
                groupCount: count(),
            })
            .from(tournamentGroups)
            .where(inArray(
                tournamentGroups.roundId,
                [...new Set(matches.map(({ roundId }) => roundId))],
            ))
            .groupBy(tournamentGroups.roundId);
        const groupCountByRound = new Map(
            groupCounts.map(({ roundId, groupCount }) => [roundId, groupCount]),
        );

        return matches.flatMap((match) => {
            if (match.gameMatchId === null) return [];
            const isFinalRound = groupCountByRound.get(match.roundId) === 1;
            const status = match.groupStatus !== TournamentGroupStatus.COMPLETED
                ? "PENDING" as const
                : isFinalRound
                    ? "FINAL" as const
                    : match.qualified
                        ? "QUALIFIED" as const
                        : "DISQUALIFIED" as const;
            return [{
                gameMatchId: match.gameMatchId,
                roundNumber: match.roundNumber,
                isFinalRound,
                status,
                playerPlace: match.playerPlace,
            }];
        });
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

        const winningPlaceThreshold = Math.floor(Object.keys(matchProgress.playerPlaces).length / 2);
        const insertUserGameStatistics = insertUserGameMatchResult.map((value) => {

            return {
                userId: value.userId,
                expPoint: value.expEarned,
                rankPoint: value.rankEarned,
                totalHandsWon: value.winCount,
                totalHandsPlayed: value.playCount,
                totalMatchesWon: value.playerPlace <= winningPlaceThreshold ? 1 : 0,
                matchPlayed: 1
            }
        })

        const insertGameStatsResult = await this.db.insert(user_game_statistics)
            .values(insertUserGameStatistics)
            .onConflictDoUpdate({
                target: user_game_statistics.userId,
                set: {
                    expPoint: sql`${user_game_statistics.expPoint} + excluded.exp_point`,
                    rankPoint: sql`greatest(0, ${user_game_statistics.rankPoint} + excluded.rank_point)`,
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

    async findOne( gameMatchId: string ) {
        const result = await this.db.query.game_matches.findFirst({
            where: {
                id: gameMatchId
            },
            with: {
                user_game_matches: true
            }
        })

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "game match not found"
            )
        }

        return result;
    }
}