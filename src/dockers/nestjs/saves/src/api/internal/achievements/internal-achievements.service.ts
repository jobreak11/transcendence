import { Injectable, Logger } from "@nestjs/common";
import { AchievementsService } from "../../../modules/achievements/achievements.service.js";
import { GetUserAchievementDto } from "./dtos/get-user-achievement.dto.js";
import e from "express";
import { CachingModule } from "../../../infrastructure/redis/caching/caching.module.js";
import { GetAchievementDto } from "./dtos/get-achievement.dto.js";
import { GetTotalUserAchievementCountDto } from "./dtos/get-total-user-achievement-count.dto.js";
import { GetTotalAllAchievementCountDto } from "./dtos/get-total-all-achievement-count.dto.js";
import { AchievementCreateDto } from "../../../modules/achievements/database/dtos/achievement-create.dto.js";
import { AchievementDto } from "../../../infrastructure/drizzle/schema/achievements/achievements.dto.js";
import { AchievementUpdateDto } from "../../../modules/achievements/database/dtos/achievement-update.dto.js";
import { UserAchievementDto } from "../../../infrastructure/drizzle/schema/user_achievements/user_achievements.dto.js";

@Injectable()
export class InternalAchievementsService {

    private readonly logger = new Logger(InternalAchievementsService.name);

    constructor(
        private readonly achievementsService: AchievementsService
    ) {

    }

    async getUserAchievements(userId: string, limit: number = 50, offset: number = 0) 
    : Promise<GetUserAchievementDto[]> {

        const result = await this.achievementsService.allUserAchievements(userId, limit, offset);

        const formated: GetUserAchievementDto[] = result.map((value) => {

            return {
                userId: value.userId,
                unlockedAt: value.unlockedAt,
                achievementId: value.achievementId,
                achievement: {
                    name: value.achievement.name,
                    condition: value.achievement.condition,
                    description: value.achievement.description,
                    titleId: value.achievement.titleId,
                    trophyId: value.achievement.trophyId,
                    createdAt: value.achievement.createdAt,
                    title: value.achievement.title !== null ? {
                        name: value.achievement.title.name,
                        description: value.achievement.title.description,
                        createdAt: value.achievement.title.createdAt
                    } : null,
                    trophy: value.achievement.trophy !== null ? {
                        name: value.achievement.trophy.name,
                        description: value.achievement.trophy.description,
                        imageUrl: value.achievement.trophy.imageUrl,
                        createdAt: value.achievement.createdAt
                    } : null,
                }
            }
        })

        return formated
    }

    async getAllAchievements(limit: number  = 50, offset: number = 0)
    : Promise<GetAchievementDto[]> {

        const result = await this.achievementsService.allAchievements(limit, offset);

        const formatted: GetAchievementDto[] = result.map((value) => {

            return {
                id: value.id,
                name: value.name,
                condition: value.condition,
                description: value.description,
                trophyId: value.trophyId,
                titleId: value.titleId,
                createdAt: value.createdAt,
                title: value.title !== null ? {
                    name: value.title.name,
                    description: value.title.description,
                    createdAt: value.title.createdAt
                }: null,
                trophy: value.trophy !== null ? {
                    name: value.trophy.name,
                    description: value.trophy.description,
                    imageUrl: value.trophy.imageUrl,
                    createdAt: value.trophy.createdAt
                }: null
            }
        })

        return formatted;
    }
    
    async getTotalUserAchievementCount(userId: string): Promise<GetTotalUserAchievementCountDto> {

        const result = await this.achievementsService.countAllUserAchievements(userId);
        return {
            totalCount:  result
        }
    }

    async getAllAchievementsCount(): Promise<GetTotalAllAchievementCountDto> {

        const result = await this.achievementsService.countAllAchievements();
        return {
            totalCount:  result
        }
    }

    async getOneAchievement(achievementId: string): Promise<GetAchievementDto> {
        
        const result = await this.achievementsService.findOne(achievementId);

        return {
            id: result.id,
            condition: result.condition,
            createdAt: result.createdAt,
            description: result.description,
            name: result.name,
            titleId: result.titleId,
            trophyId: result.trophyId,
            title: result.title !== null ? {
                createdAt: result.title.createdAt,
                description: result.title.description,
                name: result.title.name
            } : null,
            trophy: result.trophy !== null ? {
                createdAt: result.trophy.createdAt,
                name: result.trophy.name,
                imageUrl: result.trophy.imageUrl,
                description: result.trophy.description
            } : null,
        }
    }

    async createNewAchievement(body: AchievementCreateDto): Promise<AchievementDto> {
        const result = await  this.achievementsService.createOne(body)

        return result
    }

    async giveUserAchievement(userId: string, achievementId: string): Promise<UserAchievementDto> {

        const result = await this.achievementsService.giveUserAchievement(userId, achievementId);

        return result;
    }

    async updateAchievement(achievementId: string, body: AchievementUpdateDto): Promise<GetAchievementDto> {
        const result = await this.achievementsService.update(achievementId, body);

        return this.getOneAchievement(result.id);
    }

    async revokeUserAchievement(userId: string, achievementId: string): Promise<UserAchievementDto> {

        const result = await this.achievementsService.revokeUserAchievement(userId, achievementId);

        return result;
    }

    async deleteAchievement( achievementId: string ): Promise<AchievementDto> {
        const result = await this.achievementsService.deleteAchievement(achievementId);
        return result;
    }

}