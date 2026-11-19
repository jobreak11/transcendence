import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema } from "../../../infrastructure/drizzle/schema/schema.js";
import { DRIZZLE } from "../../../infrastructure/drizzle/drizzle.module.js";
import { AchievementCreateDto } from "./dtos/achievement-create.dto.js";
import { achievements } from "../../../infrastructure/drizzle/schema/achievements/achievements.schema.js";
import { logError } from "../../../utility/logError.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";
import { AchievementUpdateDto } from "./dtos/achievement-update.dto.js";
import { user_achievements } from "../../../infrastructure/drizzle/schema/user_achievements/user_achievements.schema.js";
import { and, eq } from "drizzle-orm";

@Injectable()
export class AchievementsDatabaseService {

    private readonly logger = new Logger(AchievementsDatabaseService.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbSchema.dbRelations>,

    ) {
    }


    async createOne(createDto: AchievementCreateDto) {

        try {
            const [result] = await this.db.insert(achievements)
                .values({
                    name: createDto.name,
                    condition: createDto.condition,
                    description: createDto.description,
                    titleId: createDto.titleId,
                    trophyId: createDto.trophyId,
                    createdAt: createDto.createdAt
                })
                .returning();
            
            if (!result) {
                throw logError(
                    this.logger,
                    "error from createOne()",
                    "insert to database is failed unknown",
                    HttpStatus.INTERNAL_SERVER_ERROR
                )
            }

            return result
        } catch (error: any) {

            if (error?.cause?.code) {

                if (error.cause.code === '23505') {
                    throw errorWithCode(
                        HttpStatus.CONFLICT,
                        "achievemtns already has this name"
                    )
                }
                else if (error.cause.code === '23503') {
                    throw errorWithCode(
                        HttpStatus.NOT_FOUND,
                        "titleId or Trophy Id is not exists"
                    )
                }
            }

            throw logError(
                this.logger,
                "error from createOne()",
                "unknown error from database",
                HttpStatus.INTERNAL_SERVER_ERROR,
                error
            )

        }
    }

    async allUserAchievements(userId: string, limit: number = 50, offset: number = 0) {

        if (limit < 0 || offset < 0) {
            throw logError(
                this.logger,
                "error from allUserAchievements()",
                "limit and offset invalid value",
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        const result = await this.db.query.user_achievements.findMany({
            where: {
                userId: userId
            },
            with: {
                achievement: {
                    with: {
                        title: true,
                        trophy: true
                    }
                }
            },
            limit: limit,
            offset: offset,
            orderBy: {
                unlockedAt: 'desc'
            }

        })

        return result;
    }

    async countAllUserAchievement(userId: string) {
        const result = await this.db.$count(user_achievements, eq(user_achievements.userId, userId))
        return result;
    }


    async allAchievements(limit: number = 50, offset: number = 0) {

        if (limit < 0 || offset < 0) {
            throw logError(
                this.logger,
                "error from allUserAchievements()",
                "limit and offset invalid value",
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        const result = await this.db.query.achievements.findMany({
            with: {
                title: true,
                trophy: true
            },
            limit: limit,
            offset: offset,
            orderBy: {
                createdAt: "desc",
                name: "asc"
            }
        })

        return result;
    }

    async countAllAchievements() {
        const result = await this.db.$count(achievements);
        return result;
    }

    async findOne(achivementId: string) {
        const result = await this.db.query.achievements.findFirst({
            where: {
                id: achivementId
            },
            with: {
                title: true,
                trophy: true
            }
        })

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target achievement id is not found",
            )
        }

        return result
    }

    async update(achievementId: string, updateDto: AchievementUpdateDto) {

        const [result] = await this.db.update(achievements)
            .set({
                name: updateDto.name,
                condition: updateDto.condition,
                description: updateDto.description,
                titleId: updateDto.titleId,
                trophyId: updateDto.trophyId,
                createdAt: updateDto.createdAt
            })
            .where(eq(achievements.id, achievementId))
            .returning();

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target achivements to update is not found"
            )
        }

        return result;
    }

    async giveUserAchievement(userId: string, achievementId: string) {
        try {

            const [result] = await this.db.insert(user_achievements)
                .values({
                    userId: userId,
                    achievementId: achievementId
                })
                .returning();

            if (!result) {
                throw logError(
                    this.logger,
                    "error from giveUserAchievement()",
                    "insert to database failed with unknown error",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                )
            }

            return result
        } catch (error: any) {

            if (error?.cause?.code) {

                // not unique
                if (error.cause.code === '23505') {
                    throw errorWithCode(
                        HttpStatus.CONFLICT,
                        "user already have this achievements"
                    )
                }
                else if (error.cause.code === '23505') {
                    throw errorWithCode(
                        HttpStatus.NOT_FOUND,
                        "target achievementId or userId is not found"
                    )
                }
            }

            throw logError(
                this.logger,
                "error from giveUserAchievement()",
                "unknown error from database",
                HttpStatus.INTERNAL_SERVER_ERROR,
                error
            )
        }
    }

    async revokeUserAchievement(userId: string, achievementId: string) {

        const [result] = await this.db.delete(user_achievements)
            .where(
                and(
                    eq(user_achievements.userId, userId),
                    eq(user_achievements.achievementId, achievementId)
                )
            )
            .returning()

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "user achievement relation not found"
            )
        }

        return result;
    }

    async deleteAchievement( achievementId: string ) {

        const [result] = await this.db.delete(achievements)
            .where(eq(achievements.id, achievementId))
            .returning();
        
        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target achievement id is not found"
            )
        }

        return result
    }

}