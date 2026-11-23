import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { DRIZZLE } from "../../../infrastructure/drizzle/drizzle.module.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema } from "../../../infrastructure/drizzle/schema/schema.js";
import { UserService } from "../../user/user.service.js";
import { user_game_statistics } from "../../../infrastructure/drizzle/schema/user_game_statistics/user_game_statistics.schema.js";
import { logError } from "../../../utility/logError.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";

@Injectable()
export class GameStatisticsDatabaseService {

    private readonly logger = new Logger(GameStatisticsDatabaseService.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbSchema.dbRelations>,
        private readonly userService: UserService,
    ) {}

    async getAllUserStats(limit: number = 50, offset: number = 0, orderByRank: boolean = true) {

        if (limit < 0 || offset < 0) {
            throw logError(
                this.logger,
                "error from getAllUserStats()",
                "invalid limit / offset usage",
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }

        const result = await this.db.query.user_game_statistics.findMany({
            with: {
                user: {
                    with: {
                        user_profile: true
                    }
                }
            },
            orderBy: orderByRank === false ? undefined : {
                rankPoint: "desc"
            },
            limit: limit,
            offset: offset
        })

        return result;
    }

    async findOneV2(userId: string) {

        const result = await this.db.query.user_game_statistics.findFirst({
            where: {
                userId: userId
            },
            with: {
                user: {
                    with: {
                        user_profile: true
                    }
                }
            },
        })

        if (!result) {
            throw errorWithCode(HttpStatus.NOT_FOUND, "target userId user game stats not found");
        }
        return result;
    }

    async findOne( userId: string) {

        const found = await this.db.query.user_game_statistics.findFirst({
            where: {
                userId: userId
            }
        })

        if (!found) {
            const foundUser = await this.userService.findOne(userId);

            // if found user then create new user_game_statistics row

            const [newStats] = await this.db.insert(user_game_statistics)
                .values({
                    userId: userId,
                    expPoint: 0,
                    level: 0,
                    matchPlayed: 0,
                    rankPoint: 0,
                    totalHandsPlayed: 0,
                    totalHandsWon: 0,
                    totalMatchesWon: 0
                })
                .returning();

            if (!newStats) {
                throw logError(
                    this.logger,
                    "error from findOne()",
                    "insert new row on statistic is failed",
                    HttpStatus.INTERNAL_SERVER_ERROR
                )
            }

            return newStats;
        }
        return found;

    }

}