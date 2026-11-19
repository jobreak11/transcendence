import { Injectable, Logger } from "@nestjs/common";
import { AchievementsDatabaseService } from "./database/achievements-database.service.js";
import { AchievementCreateDto } from "./database/dtos/achievement-create.dto.js";
import { AchievementUpdateDto } from "./database/dtos/achievement-update.dto.js";
import { UserService } from "../user/user.service.js";

@Injectable()
export class AchievementsService {

    private readonly logger = new Logger(AchievementsService.name);

    
    constructor (
        private readonly achievementsDatabaseService: AchievementsDatabaseService,
        private readonly userService: UserService,
    ) {

    }

    createOne(createDto: AchievementCreateDto) {
        return this.achievementsDatabaseService.createOne(createDto);
    }

    async allUserAchievements(userId: string, limit: number = 50, offset: number = 0 ) {

        await this.userService.findOne(userId);

        return this.achievementsDatabaseService.allUserAchievements(userId, limit, offset);
    }

    async countAllUserAchievements(userId: string) {
        await this.userService.findOne(userId);

        return this.achievementsDatabaseService.countAllUserAchievement(userId);
    }

    allAchievements(limit: number = 50, offset: number = 0) {
        return this.achievementsDatabaseService.allAchievements(limit, offset);
    }

    countAllAchievements() {
        return this.achievementsDatabaseService.countAllAchievements();
    }

    findOne(achievementId: string) {
        return this.achievementsDatabaseService.findOne(achievementId);
    }

    async update(achievementId: string, updateDto: AchievementUpdateDto) {

        await Promise.all([
            this.findOne(achievementId)
        ]);

        return this.achievementsDatabaseService.update(achievementId, updateDto);
    }

    async giveUserAchievement(userId: string, achievementId: string)  {

        await Promise.all([
            this.userService.findOne(userId),
            this.findOne(achievementId)
        ]);

        return this.achievementsDatabaseService.giveUserAchievement(userId, achievementId);
    }

    async revokeUserAchievement(userId: string, achievementId: string) {

        await Promise.all([
            this.userService.findOne(userId),
            this.findOne(achievementId)
        ]);

        return this.achievementsDatabaseService.revokeUserAchievement(userId, achievementId);
    }

    async deleteAchievement( achievementId: string ) {
        await Promise.all([
            this.findOne(achievementId)
        ]);

        return this.achievementsDatabaseService.deleteAchievement(achievementId);
    }

}